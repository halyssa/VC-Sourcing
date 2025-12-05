import json
from decimal import Decimal
from django.core.management.base import BaseCommand
from core.models import Company


class Command(BaseCommand):
    help = "Import companies from Coresignal JSON data file"

    def add_arguments(self, parser):
        parser.add_argument(
            "json_file",
            type=str,
            help="Path to the Coresignal JSON file (e.g., sample_data.json)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing companies before importing",
        )

    def handle(self, *args, **options):
        json_file_path = options["json_file"]

        # Clear existing data if requested
        if options.get("clear"):
            count = Company.objects.count()
            Company.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(f"Deleted {count} existing companies")
            )

        # Read and parse the JSON file (NDJSON format - one JSON object per line)
        companies_data = []
        try:
            with open(json_file_path, encoding="utf-8") as f:
                for line_num, line in enumerate(f, 1):
                    if line.strip():
                        try:
                            companies_data.append(json.loads(line))
                        except json.JSONDecodeError as e:
                            self.stdout.write(
                                self.style.ERROR(
                                    f"Error parsing line {line_num}: {e}"
                                )
                            )
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f"File not found: {json_file_path}")
            )
            return
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error reading file: {e}")
            )
            return

        self.stdout.write(f"Found {len(companies_data)} companies in file")

        # Import companies
        created = 0
        updated = 0
        skipped = 0

        for data in companies_data:
            try:
                # Extract and normalize data
                name = (data.get("name") or "").strip()
                if not name:
                    skipped += 1
                    continue

                # Map location from headquarters_city + headquarters_state
                city = (data.get("headquarters_city") or "").strip()
                state = (data.get("headquarters_state") or "").strip()
                location = f"{city}, {state}".strip(", ")
                if not location:
                    location = (data.get("headquarters_new_address") or "").strip()

                # Extract sector/industry
                sector = (data.get("industry") or "").strip() or "Other"

                # Extract funding data from latest funding round
                funding_round = "Unknown"
                funding = Decimal("0.00")

                funding_rounds = data.get("company_funding_rounds_collection", [])
                if funding_rounds and isinstance(funding_rounds, list):
                    latest_round = funding_rounds[-1]
                    funding_round = (latest_round.get("last_round_type") or "Unknown").strip() or "Unknown"

                    # Parse funding amount
                    funding_str = latest_round.get("last_round_money_raised") or ""
                    if funding_str:
                        try:
                            # Remove currency symbols and convert to number
                            # Format: "US$ 45.0M" or "$1.5B"
                            funding_clean = funding_str.replace("US$", "").replace("$", "").strip()

                            if "M" in funding_clean.upper():
                                funding = Decimal(funding_clean.upper().replace("M", "")) * Decimal("1000000")
                            elif "B" in funding_clean.upper():
                                funding = Decimal(funding_clean.upper().replace("B", "")) * Decimal("1000000000")
                            elif "K" in funding_clean.upper():
                                funding = Decimal(funding_clean.upper().replace("K", "")) * Decimal("1000")
                            else:
                                funding = Decimal(funding_clean)
                        except (ValueError, Exception):
                            funding = Decimal("0.00")

                # Extract employee count
                num_employees = data.get("employees_count", 0) or 0
                try:
                    num_employees = int(num_employees)
                except (ValueError, TypeError):
                    num_employees = 0

                # Extract founding year
                founding_year = data.get("founded")
                if founding_year:
                    try:
                        founding_year = int(founding_year)
                    except (ValueError, TypeError):
                        founding_year = None

                # Extract description
                description = (data.get("description") or "").strip()

                # Skip if missing critical fields
                if not location or not founding_year:
                    skipped += 1
                    continue

                # Create or update company
                obj, created_flag = Company.objects.update_or_create(
                    name=name,
                    defaults={
                        "sector": sector,
                        "funding_round": funding_round,
                        "funding": funding,
                        "location": location,
                        "num_employees": num_employees,
                        "founding_year": founding_year,
                        "description": description,
                    },
                )

                if created_flag:
                    created += 1
                else:
                    updated += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Error importing company '{data.get('name', 'Unknown')}': {e}"
                    )
                )
                skipped += 1

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f"\nImport complete:\n"
                f"  Created: {created}\n"
                f"  Updated: {updated}\n"
                f"  Skipped: {skipped}\n"
                f"  Total: {created + updated}"
            )
        )
