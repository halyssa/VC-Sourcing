from django.db import models

# Create your models here.
class Company(models.Model):
    name = models.CharField(max_length=255)
    funding_round = models.CharField(max_length=50)
    funding = models.IntegerField()
    location = models.CharField(max_length=100)
    num_employees = models.IntegerField()
    founding_year = models.IntegerField()
    growth_percentage = models.IntegerField()

    def __str__(self):
        return self.name