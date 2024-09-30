var searchInput = document.querySelector('.navigation input[type="text"]');

searchInput.addEventListener('focus', function() {
    this.setAttribute('placeholder', '');
});

searchInput.addEventListener('blur', function() {
    this.setAttribute('placeholder', 'Search for products');
});

//slideshow 
var slideIndex = 0;
showSlides();

// chuyển từ slide này sang slide khác
function showSlides() {
    var i;
    // lấy tất cả các slide
    var slides = document.getElementsByClassName("mySlides");
    // ẩn tất cả các slide
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
    }
    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1
    }    
    slides[slideIndex-1].style.display = "block";  
    setTimeout(showSlides, 2000); // Change image every 2 seconds
}


// When the user scrolls down to the bottom of the page, show the button

//
