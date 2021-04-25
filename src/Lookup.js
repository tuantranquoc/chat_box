function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');
export function backendLookup(method, endpoint, data, callback, token) {
    let jsonData;
    if (data) {
        jsonData = JSON.stringify(data);
    }
    console.log("data", data);
    console.log("method", method);
    // getting html elements
    const xhr = new XMLHttpRequest();
    // `http://localhost:8000/api${endpoint}`
    const url = `http://localhost:8000/api${endpoint}`;
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", "application/json");
    if (csrftoken) {
        // xhr.setRequestHeader("X-CSRFToken", csrftoken);


    }
    if (token) {
        if (localStorage.getItem("token") !== undefined) {
            console.log("sending token", localStorage.getItem("token"));
            xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("token"));
        }
    }
    xhr.responseType = "json";
    xhr.onload = function () {
        if (xhr.status === 403) {
            if (xhr.response.detail !== undefined) {
                const detail = xhr.response.detail;
                if (detail === "Authentication credentials are not provided") {
                    if (window.location.href.indexOf("login") === -1) {
                        window.location.href = "/login?showLoginRequired=true";
                    }
                }
            }
        }
        callback(xhr.response, xhr.status);
    };
    xhr.onerror = function (e) {
        console.log(e);
        callback({ "message": "the request was an error!" }, 400)
    };
    xhr.send(jsonData);
}