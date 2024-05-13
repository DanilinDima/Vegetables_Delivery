from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User


class Storage(models.Model):
    STATUS_CHOICES = [
        ('A', 'Active'),
        ('N', 'Not active'),
    ]
    product_name = models.CharField(max_length=100, null=False, blank=False)
    available_qty = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    price_per_kilo = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    description = models.TextField(null=False, blank=True)
    status = models.CharField(max_length=20, null=False, blank=False, choices=STATUS_CHOICES)

    def __str__(self):
        return f"Product(name:{self.product_name}, qty:{self.available_qty}, price:{self.price_per_kilo},status:{self.status} ,id:{self.id}, "


class Customers(models.Model):
    user = models.OneToOneField(User, on_delete=models.PROTECT)
    address = models.CharField(max_length=250, null=False, blank=False)
    phone_number = models.CharField(max_length=20, null=False, blank=False)


class Couriers(models.Model):
    COURIER_CHOISES = [
        ('A', 'Active'),
        ('N', 'Not active')
    ]
    first_name = models.CharField(max_length=100, null=False, blank=False)
    last_name = models.CharField(max_length=100, null=False, blank=False)
    phone_number = models.CharField(max_length=20, null=False, blank=False)
    status = models.CharField(max_length=20, null=False, blank=False, choices=COURIER_CHOISES)

    def __str__(self):
        return f"Courier(name:{self.last_name} {self.first_name}, ,status:{self.status} ,id:{self.id}, "


class Orders(models.Model):
    STATUS_CHOICES = [
        ('R', 'Received'),
        ('D', 'Out for Delivery'),
        ('C', 'Delivered'),
        ('X', 'Cancelled'),
    ]
    default_courier = Couriers.objects.filter(status="A", first_name="default_courier")
    date = models.DateTimeField(auto_now_add=True, auto_now=False)
    customer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
    )
    delivery_address = models.CharField(max_length=250, null=False, blank=False)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    courier = models.ForeignKey(
        Couriers,
        on_delete=models.PROTECT,
        )
    status = models.CharField(max_length=10, null=False, blank=False, choices=STATUS_CHOICES, default='R')
    customer_comment = models.TextField(null=False, blank=True)
    products = models.ManyToManyField(
        Storage,
        through="OrderProductsDetails",
        through_fields=("order", "product")
    )

    def __str__(self):
        return f"Order(id:{self.id}, status:{self.status}, customer:{self.customer}"


class OrderProductsDetails(models.Model):
    order = models.ForeignKey(
        Orders,
        on_delete=models.PROTECT
    )
    product = models.ForeignKey(
        Storage,
        on_delete=models.PROTECT
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    sell_price_per_kilo = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)


