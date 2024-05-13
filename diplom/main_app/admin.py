from django.contrib import admin
from . import models

admin.site.register(models.Storage)
admin.site.register(models.Customers)
admin.site.register(models.Couriers)
admin.site.register(models.Orders)
admin.site.register(models.OrderProductsDetails)
# Register your models here.
