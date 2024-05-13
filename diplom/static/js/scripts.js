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
    // Check if totalPrice is exactly equal to 0
    if (totalPrice === 0) {
        totalPriceCell.innerText = '0'; // Display 0 without decimal places
    } else {
        totalPriceCell.innerText = totalPrice.toFixed(2); // Display with 2 decimal places
    }

    updateTotalPrice();
};

const updateTotalPrice = () => {
    const table = document.getElementById("productTable");
    const rows = table.getElementsByTagName("tr");
    let totalPrice = 0;
    for (let i = 1; i < rows.length - 3; i++) {
        const row = rows[i];
        const totalPriceCell = row.querySelector("#row_total");
        totalPrice += parseFloat(totalPriceCell.innerText);
    }
    document.getElementById("totalPrice").innerText = totalPrice.toFixed(2);
};

const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
// Function to get the CSRF token from the page
function getCsrfToken() {
    return csrfToken;
    }

function sendOrderToBackend(orderData) {
    fetch('/submit-order/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() // Include the CSRF token for Django's CSRF protection
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (response.ok) {
            console.log('Order submitted successfully');
            // Fetch updated data after order submission
            fetchUpdatedData();
        } else {
            console.error('Error submitting order');
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
        // Update the table with the new data
        updateTable(data);
    })
    .catch(error => {
        console.error('Error fetching updated data:', error);
    });
    }


function updateTable(data) {
    // Clear existing table data
    const tableBody = document.querySelector('#productTable tbody');
    tableBody.innerHTML = '';

    // Populate the table with the updated data
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
    // Update the total price if needed
    updateTotalPrice();
}




// Function to handle the click event on the Submit Order button
function submitOrder() {
    const table = document.getElementById("productTable");
    const rows = table.getElementsByTagName("tr");
    const productData = []; // List of dictionaries with products

    for (let i = 1; i < rows.length - 3; i++) {
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

    // Send the order data to the backend
    sendOrderToBackend(orderData);
}


// Открытие модального окна

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

// Закрытие модального окна
closeModalButton.addEventListener("click", function() {
    confirmationModal.style.display = "none";
});

// Подтверждение отправки заказа
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

    // Обновление общей суммы в модальном окне
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

//Password modal window

const confirmationModal = document.getElementById("confirmationModal");
const openProfileModalButton = document.getElementById("openProfileModal");
const closeModalButton = document.getElementsByClassName("close")[0];
const confirmProfileSubmitButton = document.getElementById("confirmProfileSubmit");
const cancelSubmitButton = document.getElementById("cancelSubmit");
const submitAlert = document.getElementsByClassName("orderAlertMessage")[0];

openProfileModalButton.addEventListener("click", function() {
    document.getElementById("confirmationModal").style.display = "block";
    });


closeModalButton.addEventListener("click", function() {
    confirmationModal.style.display = "none";
});


confirmProfileSubmitButton.addEventListener("click", function() {
    confirmationModal.style.display = "none"
});


cancelSubmitButton.addEventListener("click", function() {
    confirmationModal.style.display = "none";
});


document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("confirmationModal");
    modal.style.display = "none";
});





