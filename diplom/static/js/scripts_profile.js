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
    updateProfile()
    confirmationModal.style.display = "none"
});


cancelSubmitButton.addEventListener("click", function() {
    confirmationModal.style.display = "none";
});


document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("confirmationModal");
    modal.style.display = "none";
});




const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
function getCsrfToken() {
    return csrfToken;
    }

function sendProfileToBackend(profileData) {
    fetch('/submit-profile/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() // Include the CSRF token for Django's CSRF protection
        },
        body: JSON.stringify(profileData)
    })
    .then(response => {
        if (response.ok) {
            console.log('Profile updated successfully');
            location.reload();
        } else {
            console.error('Error updating profile');
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
    });
    }

function updateProfile() {

    const user_name = document.querySelector("#customerProfileUserName").value;
    const first_name = document.querySelector("#customerProfileFirstName").value;
    const last_name = document.querySelector("#customerProfileLastName").value;
    const email = document.querySelector("#customerProfileEmail").value;
    const address = document.querySelector("#customerProfileAddress").value;
    const phone = document.querySelector("#customerProfilePhone").value;


    const userData = {
        username: user_name,
        firstname: first_name,
        lastname: last_name,
        email: email,
        address: address,
        phone: phone
    };

    sendProfileToBackend(userData);
}

function fetchOrderDetailsData(orderId) {
    fetch(`/get-order-details-updated-data/?orderId=${orderId}`)
    .then(response => response.json())
    .then(data => {
         updateOrderDetailsTable(data);
    })
    .catch(error => {
        console.error('Error fetching updated data:', error);
    });
    }


function updateOrderDetailsTable(data) {
    const tableBody = document.querySelector('#orderDetailsTable tbody');
    tableBody.innerHTML = '';

    data.forEach(product => {
    const row = `<tr>
                    <td>${product.product_name}</td>
                    <td>${product.quantity}</td>
                    <td>${product.sell_price_per_kilo}</td>
                    <td>${product.total_price}</td>
                </tr>`;
    tableBody.innerHTML += row;
});
}

document.getElementById("ordersTable").addEventListener("click", function(event) {
    if (event.target.tagName === "TD") {
        const allRows = document.querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('selected'));

        const parentRow = event.target.closest('tr');
        parentRow.classList.add('selected');

        const orderId = parentRow.querySelector('.hidden').textContent;
        fetchOrderDetailsData(orderId);
    }
});