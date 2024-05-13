from _decimal import Decimal
from django.shortcuts import render, redirect
from . import models
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_protect
import json
from django.contrib.auth import authenticate, login, logout
from . import forms
from django.contrib.auth import update_session_auth_hash


def main_page(request):
    if request.user.is_authenticated:
        products = models.Storage.objects.all()

        products_show_info = []
        for product in products:
            if product.status == "A":
                products_show_info.append(
                    {
                        "name": product.product_name,
                        "description": product.description,
                        "price": product.price_per_kilo,
                        "qty": product.available_qty,
                        "id": product.id
                    }
                )
        logged_user_id = request.user.id
        customer = models.User.objects.get(id=logged_user_id)

        customer_info = {
            "first_name": customer.first_name,
            "last_name": customer.last_name,
            "email": customer.email,
            "phone": customer.customers.phone_number,
            "address": customer.customers.address,
        }

        context = {"my_products": products_show_info,
                   "customer_info": customer_info}
        return render(request, "main_page/main_page.html", context)
    else:
        return redirect('login')


def in_stock_checker(data):
    for item in data["products"]:
        product = models.Storage.objects.get(id=item['product_id'])
        order_qty_decimal = Decimal(str(item['order_qty']))
        if order_qty_decimal > product.available_qty:
            return False
        return True


@csrf_protect
def submit_order(request):
    if request.method == 'POST':
        order_data = json.loads(request.body)
        if in_stock_checker(order_data):
            customer = models.User.objects.get(id=request.user.id)
            for item in order_data["other_data"]:
                if "total_price" in item:
                    total_price = item["total_price"]
                elif "address" in item:
                    address = item["address"]
                elif "comments" in item:
                    comments = item["comments"]
            courier = models.Couriers.objects.get(first_name='default_courier')
            order = models.Orders.objects.create(
                customer=customer,
                total_price=total_price,
                delivery_address=address,
                courier=courier,
                customer_comment=comments
            )
            order.save()

            for item in order_data["products"]:
                print(item)
                product = models.Storage.objects.get(id=item['product_id'])
                order_qty_decimal = Decimal(str(item['order_qty']))
                sell_price_per_kilo_decimal = Decimal(str(item['price']))
                order_total_price_decimal = Decimal(str(item['total_product_price']))

                product.available_qty = product.available_qty - order_qty_decimal
                product.save()
                order_details = models.OrderProductsDetails.objects.create(
                    order=order,
                    product=product,
                    quantity=order_qty_decimal,
                    total_price=order_total_price_decimal,
                    sell_price_per_kilo=sell_price_per_kilo_decimal
                )
                order_details.save()

            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Order quantity is more than in stock'})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method'})


def get_updated_data(request):
    updated_data = list(models.Storage.objects.filter(status='A').values())
    return JsonResponse(updated_data, safe=False)


def user_login(request):
    if not request.user.is_authenticated:
        if request.method == 'POST':
            form = forms.LoginForm(request.POST)
            if form.is_valid():
                cd = form.cleaned_data
                user = authenticate(username=cd['username'], password=cd['password'])
                if user is not None:
                    if user.is_active:
                        login(request, user)
                        return redirect('main_page')
                    else:
                        return HttpResponse('Disabled account')
                else:
                    return HttpResponse('Invalid login')
        else:
            form = forms.LoginForm
            context = {'form': form}
            return render(request, 'main_page/login.html', context)
    else:
        return redirect('main_page')

def user_singup(request):
    if not request.user.is_authenticated:
        if request.method == 'POST':
            form = forms.RegistrationForm(request.POST)
            if form.is_valid():
                if form.check_password():
                    user = form.save(commit=False)
                    user.save()
                    address = form.cleaned_data.get('address')
                    phone_number = form.cleaned_data.get('phone_number')
                    models.Customers.objects.create(user=user, address=address, phone_number=phone_number)
                    return redirect('login')
                else:
                    form.add_error("password2", "entered passwords do not match")
                    context = {'form': form}
                    return render(request, 'main_page/singup.html', context)
        else:
            form = forms.RegistrationForm
            context = {'form': form}
            return render(request, 'main_page/singup.html', context)
    else:
        return redirect('main_page')

def logout_view(request):
    logout(request)
    return redirect('login')


def user_profile(request):
    if request.user.is_authenticated:
        logged_user_id = request.user.id
        user = models.User.objects.get(id=logged_user_id)
        orders = models.Orders.objects.filter(customer=user)

        customer_info = {
            "user_name": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.customers.phone_number,
            "address": user.customers.address,
        }

        def get_order_status(status):
            status_names = {
                'R': 'Received',
                'D': 'Out for Delivery',
                'C': 'Delivered',
                'X': 'Cancelled'
            }
            return status_names[status]

        orders_info = []
        for order in orders:
            orders_info.append(
                {
                    "date": order.date,
                    "status": get_order_status(order.status),
                    "total_price": order.total_price,
                    "delivery_address": order.delivery_address,
                    "comments": order.customer_comment,
                    "id": order.id
                }
            )
        password_change_form = forms.CustomPasswordChangeForm(user=request.user)

        context = {
            "customer_info": customer_info,
            "orders_info": orders_info[::-1],
            "password_change_form": password_change_form,  # Добавление формы в контекст
        }
        return render(request, 'main_page/profile.html', context)

    else:
        return redirect('login')

@csrf_protect
def update_profile(request):
    if request.method == 'POST':
        user_data = json.loads(request.body)
        print(user_data)
        user = models.User.objects.get(id=request.user.id)
        user.username = user_data['username']
        user.first_name = user_data['firstname']
        user.last_name = user_data['lastname']
        user.email = user_data['email']
        user.customers.address = user_data['address']
        user.customers.phone_number = user_data['phone']
        user.save()
        user.customers.save()
        return JsonResponse({'success': True})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method'})


def get_profile_updated_data(request):
    if request.user.is_authenticated:
        logged_user_id = request.user.id
        user = models.User.objects.get(id=logged_user_id)

        customer_info = {
            "user_name": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.customers.phone_number,
            "address": user.customers.address,
        }

        context = {"customer_info": customer_info}
        return render(request, 'main_page/profile.html', context)


def fetch_order_details_data(request):
    if request.method == 'GET' and 'orderId' in request.GET:
        order_id = request.GET.get('orderId')
        try:
            order_details = models.OrderProductsDetails.objects.filter(order_id=order_id)
            data = []
            for detail in order_details:
                data.append(
                {'product_name': detail.product.product_name,
                 'quantity': detail.quantity,
                 'sell_price_per_kilo': detail.sell_price_per_kilo,
                 'total_price': detail.total_price
                 })
            return JsonResponse(data, safe=False)
        except models.OrderProductsDetails.DoesNotExist:
            return JsonResponse({'error': 'Order details not found'}, status=404)
    else:
        return JsonResponse({'error': 'Invalid request method or orderId not provided'}, status=400)


@csrf_protect
def change_password(request):
    if request.user.is_authenticated:
        if request.method == 'POST':
            form = forms.CustomPasswordChangeForm(request.user, request.POST)
            if form.is_valid():
                user = form.save()
                update_session_auth_hash(request, user)
                return redirect('profile')
            else:
                form.add_error("new_password2", "entered passwords do not match")
                context = {'form': form}
                return render(request, 'main_page/password_change.html', context)
        else:
            form = forms.CustomPasswordChangeForm(request.user)
            context = {'form': form}
            return render(request, 'main_page/password_change.html', context)
    else:
        return redirect('login')
