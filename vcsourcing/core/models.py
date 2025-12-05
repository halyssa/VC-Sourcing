from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Company(models.Model):
    name = models.CharField(max_length=255)
    sector = models.CharField(max_length=100)
    funding_round = models.CharField(max_length=50)
    funding = models.DecimalField(max_digits=15, decimal_places=2)
    location = models.CharField(max_length=255)
    num_employees = models.IntegerField()
    founding_year = models.IntegerField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Watchlist(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="watchlist_items",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="watchlisted_by",
    )

    class Meta:
        unique_together = ("user", "company")
        verbose_name = "Watchlist item"
        verbose_name_plural = "Watchlist items"

    def __str__(self):
        return f"{self.user} – {self.company}"
