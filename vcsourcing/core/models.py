from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Company(models.Model):
    name = models.CharField(max_length=255)
    funding_round = models.CharField(max_length=50)
    funding = models.DecimalField(max_digits=15, decimal_places=2)
    location = models.CharField(max_length=255)
    num_employees = models.IntegerField()
    founding_year = models.IntegerField()
    growth_percentage = models.IntegerField()

    def __str__(self):
        return self.name
class Watchlist(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="watchlist",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="watchlisted_by",
    )

    class Meta:
        # user should not be able to add same company twice
        unique_together = ("user", "company")
        verbose_name = "Watchlist item"
        verbose_name_plural = "Watchlist items"

    def __str__(self):
        return f"{self.user} – {self.company}"