const roundAndCheck = (input, maxQty) => {
    let value = parseFloat(input.value);
    input.value = value.toFixed(1);
    if (value <= 0) input.value = 0;
    if (value > maxQty) input.value = maxQty;
};

const updateRowTotal = input => {
    const row = input.parentNode.parentNode;
    const orderQty = parseFloat(input.value);
    const roundedQty = parseFloat(orderQty.toFixed(1));
    const price = parseFloat(row.querySelector(".price").innerText);
    const totalPriceCell = row.querySelector("#row_total");
    let totalPrice = roundedQty * price;
    if (totalPrice === 0) {
        totalPriceCell.innerText = '0';
    } else {
        totalPriceCell.innerText = totalPrice.toFixed(2);
    }

    updateTotalPrice();
};

const updateTotalPrice = () => {
    const table = document.getElementById("productTable");
    const rows = table.getElementsByTagName("tr");
    let totalPrice = 0;
    for (let i = 1; i < rows.length - 4; i++) {
        const row = rows[i];
        const totalPriceCell = row.querySelector("#row_total");
        totalPrice += parseFloat(totalPriceCell.innerText);
    }
    document.getElementById("totalPrice").innerText = totalPrice.toFixed(2);
};

const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
function getCsrfToken() {
    return csrfToken;
    }

function sendOrderToBackend(orderData) {
    fetch('/submit-order/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (response.ok) {
            const errorMessageElement = document.getElementsByClassName("orderStockAlertMessage")[0];
            response.json().then(data => {
                if (data.success) {
                    console.log('Order submitted successfully');
                    fetchUpdatedData();
                    errorMessageElement.style.display = "none";
                } else {
                    console.error('Error submitting order:', data.error);
                    fetchUpdatedData();
                    errorMessageElement.style.display = "table-cell";
                }
            });
        } else {
            console.error('Error submitting order:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error submitting order:', error);
    });
}

function fetchUpdatedData() {
    fetch('/get-updated-data/')
    .then(response => response.json())
    .then(data => {
        updateTable(data);
    })
    .catch(error => {
        console.error('Error fetching updated data:', error);
    });
    }


function updateTable(data) {
    const tableBody = document.querySelector('#productTable tbody');
    tableBody.innerHTML = '';

    data.forEach(product => {
    const row = `<tr>
                    <td title="${product.description}">${product.product_name}</td>
                    <td class="price">${product.price_per_kilo}</td>
                    <td>${product.available_qty}</td>
                    <td>
                        <input class="input_qty" type="number" name="order_qty" min="0" max="${product.available_qty}" value="0" step="0.1" onblur="roundAndCheck(this, ${product.available_qty})" onchange="updateRowTotal(this)">
                    </td>
                    <td id="row_total">0</td>
                    <td class="hidden">${product.id}</td>
                </tr>`;
    tableBody.innerHTML += row;
});
    document.querySelector(".input_order_comments").value = '';
    updateTotalPrice();
}


function submitOrder() {
    const table = document.getElementById("productTable");
    const rows = table.getElementsByTagName("tr");
    const productData = [];

    for (let i = 1; i < rows.length - 4; i++) {
        const row = rows[i];
        const productName = row.cells[0].textContent;
        const price = parseFloat(row.cells[1].textContent);
        const availableQty = parseFloat(row.cells[2].textContent);
        const orderQty = parseFloat(row.cells[3].querySelector("input").value);
        const totalProductPrice = parseFloat(row.cells[4].textContent);
        const productId = row.cells[5].textContent;

        if (orderQty > 0) {
            productData.push({
                product_name: productName,
                price: price,
                order_qty: orderQty,
                total_product_price: totalProductPrice,
                product_id: productId
            });
        }
    }

    const comments = document.querySelector(".input_order_comments").value;
    const deliveryAddress = document.querySelector(".input_delivery_addr").value;
    const totalPrice = document.getElementById("totalPrice").textContent;

    const orderData = {
        products: productData,
        other_data: [
            { total_price: totalPrice },
            { comments: comments },
            { address: deliveryAddress }
        ]
    };

    sendOrderToBackend(orderData);
}


//Modal window

const confirmationModal = document.getElementById("confirmationModal");
const openModalButton = document.getElementById("openModal");
const closeModalButton = document.getElementsByClassName("close")[0];
const confirmSubmitButton = document.getElementById("confirmSubmit");
const cancelSubmitButton = document.getElementById("cancelSubmit");
const submitAlert = document.getElementsByClassName("orderAlertMessage")[0];

openModalButton.addEventListener("click", function() {
    const totalPrice = parseFloat(document.getElementById("totalPrice").textContent);
    if (totalPrice > 0) {
        fillOrderSummary();
        document.getElementById("confirmationModal").style.display = "block";
        submitAlert.style.display = "none"
    } else {
        submitAlert.style.display = "table-cell";
    }
});

closeModalButton.addEventListener("click", function() {
    confirmationModal.style.display = "none";
});

confirmSubmitButton.addEventListener("click", function() {
    submitOrder();
    confirmationModal.style.display = "none"
});


cancelSubmitButton.addEventListener("click", function() {
    confirmationModal.style.display = "none";
});



function fillOrderSummary() {
    const orderSummaryTableBody = document.getElementById("orderSummaryTableBody");
    orderSummaryTableBody.innerHTML = "";

    const productRows = document.querySelectorAll("#productTable tbody tr");
    productRows.forEach(function(row) {
    const orderQtyInput = row.querySelector("input.input_qty");
    const orderQty = parseFloat(orderQtyInput.value);

    if (orderQty > 0) {
        const productName = row.cells[0].textContent;
        const price = parseFloat(row.cells[1].textContent);
        const totalProductPrice = parseFloat(row.cells[4].textContent);


        const summaryRow = `
            <tr>
                <td>${productName}</td>
                <td>${price.toFixed(2)}</td>
                <td>${orderQty.toFixed(1)}</td>
                <td>${totalProductPrice.toFixed(2)}</td>
            </tr>
        `;
        orderSummaryTableBody.insertAdjacentHTML("beforeend", summaryRow);
    }
});

    const totalPriceElement = document.getElementById("modalTotalPrice");
    const totalPrice = parseFloat(document.getElementById("totalPrice").textContent);
    totalPriceElement.textContent = totalPrice.toFixed(2);

    const customerNameElement = document.getElementById("modalCustomerName");
    const phoneElement = document.getElementById("modalPhone");
    const deliveryAddressElement = document.getElementById("modalDeliveryAddress");
    const commentsElement = document.getElementById("modalComments");

    const customerFirstName = document.getElementById('customerInfoFirstName');
    const customerLastName = document.getElementById('customerInfoLastName');
    const phone = document.getElementById('customerInfoPhone');
    const deliveryAddress = document.getElementById('customerInfoDeliveryAddress');
    const comments = document.querySelector(".input_order_comments");

    if (customerFirstName && customerLastName && phone && deliveryAddress && comments) {
        customerNameElement.textContent = `${customerFirstName.textContent} ${customerLastName.textContent}`;
        phoneElement.textContent = phone.textContent;
        deliveryAddressElement.textContent = deliveryAddress.value;
        commentsElement.textContent = comments.value;
    } else {
        console.error("Error: One or more customer information elements were not found.");
    }
}


function getCsrfToken() {
    return csrfToken;
}

document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("confirmationModal");
    modal.style.display = "none";
});