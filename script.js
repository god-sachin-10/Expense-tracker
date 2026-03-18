document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    
    mobileBtn.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        navList.classList.toggle('active');
    });

    // Close mobile menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileBtn.classList.remove('active');
            navList.classList.remove('active');
        });
    });

    // Sticky Header Logic
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            // Check original header state
            if(window.innerWidth > 768){
                header.classList.remove('scrolled');
            }
        }
        
        // Update active nav link based on scroll position
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Initial scroll check
    if (window.scrollY > 50 || window.innerWidth <= 768) {
        header.classList.add('scrolled');
    }

    // Window resize handler for header
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            header.classList.add('scrolled');
        } else {
            if (window.scrollY <= 50) {
                header.classList.remove('scrolled');
            }
        }
    });

    // Smooth Scrolling for navigation links (Modern approach)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Adjust scroll position for sticky header
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Formspree handles the form submission automatically,
    // so we no longer need to preventDefault or show an alert here.
});
