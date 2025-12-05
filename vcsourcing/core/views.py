from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Company, Watchlist
from .serializers import CompanySerializer, WatchlistSerializer, CompanySummarySerializer
from django.http import JsonResponse
from .llm_service import run_prompt
import logging

logger = logging.getLogger(__name__)
try:
    from django_filters.rest_framework import DjangoFilterBackend
    FILTER_BACKENDS = [DjangoFilterBackend]
except Exception:
    #Fall back to no filter backend.
    FILTER_BACKENDS = []
# Health check endpoint
@api_view(['GET'])
def health(request):
    return Response({"status": "ok"}, status=200)

def home(request):
    return JsonResponse({"message": "Welcome to the VC-Sourcing API"})

# List all companies
class CompanyListView(generics.ListAPIView):
    serializer_class = CompanySerializer

    def get_queryset(self):
        qs = Company.objects.all()
        params = self.request.query_params

        # ----- Filters -----

        # 1) sector: case-insensitive exact match on normalized sector
        sector = params.get("sector")
        if sector:
            qs = qs.filter(sector__iexact=sector)

        # 2) funding_round: case-insensitive exact match
        funding_round = params.get("funding_round")
        if funding_round:
            qs = qs.filter(funding_round__iexact=funding_round)

        # 3) location: case-insensitive substring match ("USA" matches "New York, USA")
        location = params.get("location")
        if location:
            qs = qs.filter(location__icontains=location)

        # 4) search: case-insensitive substring match against name
        search = params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        # ----- Sorting -----

        sort_by = params.get("sort_by")
        sort_dir = params.get("sort_dir")

        valid_sort_fields = {
            "name": "name",
            "funding": "funding",
            "funding_round": "funding_round",
            "num_employees": "num_employees",
        }

        if sort_by in valid_sort_fields and sort_dir in ["asc", "desc"]:
            field_name = valid_sort_fields[sort_by]
            if sort_dir == "desc":
                field_name = f"-{field_name}"
            qs = qs.order_by(field_name)
        else:
            # Default ordering if sort params are missing/invalid
            qs = qs.order_by("name")

        return qs 


# Retrieve a single company by ID
class CompanyDetailView(generics.RetrieveAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

@api_view(['GET'])
def health(request):
    payload = {"status": "ok"}
    return Response(payload)

@api_view(['GET'])
def llm_test(request):
    """Test endpoint to verify OpenAI connectivity"""
    test_prompt = "Tell me a little bit about VC-Sourcing."
    response_text = run_prompt(test_prompt)
    return Response({"response": response_text})

class UserWatchlistView(generics.ListAPIView):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs["user_id"]

        # 3. validation: user can only view their own watchlist
        if self.request.user.id != user_id:
            raise PermissionDenied("You can only view your own watchlist.")

        return (
            Watchlist.objects.filter(user_id=user_id)
            .select_related("company")
            .order_by("company__name")
        )
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def watchlist_add(request):
    """
    Body: { "company_id": <int> }
    Adds the company to the authenticated user's watchlist.
    """
    company_id = request.data.get("company_id")
    if not company_id:
        return Response(
            {"detail": "company_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response(
            {"detail": "Company not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # unique_together also enforces this, but we give a nice error first
    watchlist_item, created = Watchlist.objects.get_or_create(
        user=request.user,
        company=company,
    )

    if not created:
        return Response(
            {"detail": "Company is already in your watchlist."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = WatchlistSerializer(watchlist_item)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def watchlist_remove(request):
    """
    Body: { "company_id": <int> }
    Removes the company from the authenticated user's watchlist.
    """
    company_id = request.data.get("company_id")
    if not company_id:
        return Response(
            {"detail": "company_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        watchlist_item = Watchlist.objects.get(
            user=request.user,
            company_id=company_id,
        )
    except Watchlist.DoesNotExist:
        return Response(
            {"detail": "Watchlist item not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    watchlist_item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def company_summary(request, pk):
    """
    Generate an LLM-powered summary for a specific company.

    POST /companies/{id}/summary

    Returns:
        {
            "company_id": <int>,
            "summary": <string>
        }
    """
    # Look up company by id
    try:
        company = Company.objects.get(pk=pk)
    except Company.DoesNotExist:
        return Response(
            {"detail": "Company not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Build a concise prompt for the LLM
    prompt = (
        f"Summarize this company for a VC associate: "
        f"Name: {company.name}, "
        f"Location: {company.location}, "
        f"Sector: {company.sector}, "
        f"Funding Round: {company.funding_round}, "
        f"Total Funding: ${company.funding:,.0f}, "
        f"Employees: {company.num_employees}, "
        f"Founded: {company.founding_year}. "
    )
    if company.description:
        prompt += f"Description: {company.description}. "
    prompt += "Highlight the company's stage and investment potential in 3 sentences."

    # Call LLM service
    try:
        summary_text = run_prompt(prompt)

        # Check if the LLM service returned an error message
        if summary_text.startswith("LLM API Error:"):
            logger.error(f"LLM service error for company {pk}: {summary_text}")
            return Response(
                {"detail": "Failed to generate summary. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Validate that we got a non-empty summary
        if not summary_text or not summary_text.strip():
            logger.error(f"Empty summary returned for company {pk}")
            return Response(
                {"detail": "Failed to generate summary. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Return successful response
        response_data = {
            "company_id": company.id,
            "summary": summary_text.strip(),
        }

        serializer = CompanySummarySerializer(data=response_data)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Unexpected error generating summary for company {pk}: {str(e)}")
        return Response(
            {"detail": "An unexpected error occurred. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_companies(request):
    """
    Get personalized company recommendations based on user's watchlist.

    GET /api/companies/recommended/

    Returns:
        List of recommended companies with similarity scores
    """
    user = request.user

    # Get user's watchlist companies
    watchlist_items = Watchlist.objects.filter(user=user).select_related("company")
    watchlisted_companies = [item.company for item in watchlist_items]

    # If watchlist is empty, return empty list
    if not watchlisted_companies:
        return Response({"results": []}, status=status.HTTP_200_OK)

    # Build user profile from watchlist
    funding_rounds = [c.funding_round for c in watchlisted_companies]
    locations = [c.location for c in watchlisted_companies]

    # Find most common funding round
    from collections import Counter
    funding_counter = Counter(funding_rounds)
    location_counter = Counter(locations)

    most_common_funding_round = funding_counter.most_common(1)[0][0] if funding_counter else None
    most_common_location = location_counter.most_common(1)[0][0] if location_counter else None

    # Get all companies not in watchlist
    watchlisted_ids = [c.id for c in watchlisted_companies]
    candidate_companies = Company.objects.exclude(id__in=watchlisted_ids)

    # Compute similarity scores
    scored_companies = []
    for company in candidate_companies:
        score = 0

        # Funding round match → +2
        if most_common_funding_round and company.funding_round == most_common_funding_round:
            score += 2

        # Location match → +2
        if most_common_location and company.location == most_common_location:
            score += 2

        # Additional location matching: partial match (same city or state)
        if most_common_location and most_common_location in company.location:
            score += 1
        elif most_common_location:
            # Check if any watchlist location is in this company's location
            for loc in locations:
                if loc in company.location or company.location in loc:
                    score += 1
                    break

        scored_companies.append((company, score))

    # Sort by score descending, then by funding descending
    scored_companies.sort(key=lambda x: (x[1], x[0].funding), reverse=True)

    # Get top recommendations (limit to 10)
    top_recommendations = [company for company, score in scored_companies[:10] if score > 0]

    # If no scored matches, return highest funded companies
    if not top_recommendations:
        top_recommendations = list(
            candidate_companies.order_by("-funding")[:5]
        )

    # Serialize the results
    serializer = CompanySerializer(top_recommendations, many=True)
    return Response({"results": serializer.data}, status=status.HTTP_200_OK)