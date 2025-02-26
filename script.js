document.addEventListener('DOMContentLoaded', function() {
    // Fetch the courses JSON file
    fetch('courses.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store courses globally for filtering
            window.allCourses = data.courses;
            
            // Display the courses
            displayCourses(data.courses);
            
            // Setup search functionality
            setupSearch(data.courses);
            
            // Setup filter buttons
            setupFilters();
        })
        .catch(error => {
            console.error('Error fetching courses:', error);
            document.getElementById('coursesTableBody').innerHTML = 
                `<tr><td colspan="4" class="loading-message">Error loading courses: ${error.message}</td></tr>`;
        });
});

function displayCourses(courses) {
    const tableBody = document.getElementById('coursesTableBody');
    tableBody.innerHTML = '';
    
    // Sort courses by year and semester
    courses.sort((a, b) => {
        // Convert year_level to numeric value for comparison
        const yearA = parseInt(a.year_level.replace(/\D/g, ''));
        const yearB = parseInt(b.year_level.replace(/\D/g, ''));
        
        if (yearA !== yearB) {
            return yearA - yearB;
        }
        
        // If years are the same, sort by semester
        const semA = parseInt(a.sem.replace(/\D/g, ''));
        const semB = parseInt(b.sem.replace(/\D/g, ''));
        return semA - semB;
    });
    
    // Track the current year level for dividers
    let currentYearLevel = null;
    
    courses.forEach(course => {
        // Check if we need to add a year divider
        if (course.year_level !== currentYearLevel) {
            currentYearLevel = course.year_level;
            
            // Add a divider row
            const dividerRow = document.createElement('tr');
            dividerRow.className = 'year-divider';
            dividerRow.innerHTML = `
                <td colspan="4">${course.year_level} Year Courses</td>
            `;
            tableBody.appendChild(dividerRow);
        }
        
        const row = document.createElement('tr');
        
        // Format the year and semester
        const yearTerm = `${course.year_level} Year - ${course.sem} Semester`;
        
        row.innerHTML = `
            <td>${yearTerm}</td>
            <td>${course.code}</td>
            <td>${course.description}</td>
            <td>${course.credit}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Display summary
    displaySummary(courses);
}

function displaySummary(courses) {
    const summaryContainer = document.getElementById('summary-container');
    
    // Calculate total courses
    const totalCourses = courses.length;
    
    // Calculate total credits
    const totalCredits = courses.reduce((sum, course) => sum + parseFloat(course.credit), 0);
    
    // Count courses by year
    const coursesByYear = {};
    courses.forEach(course => {
        if (!coursesByYear[course.year_level]) {
            coursesByYear[course.year_level] = 0;
        }
        coursesByYear[course.year_level]++;
    });
    
    // Calculate credits by year
    const creditsByYear = {};
    courses.forEach(course => {
        if (!creditsByYear[course.year_level]) {
            creditsByYear[course.year_level] = 0;
        }
        creditsByYear[course.year_level] += parseFloat(course.credit);
    });
    
    // Create filter buttons if they don't already exist
    let filterHTML = '';
    if (!document.querySelector('.filter-options')) {
        filterHTML = `
            <div class="filter-options">
                <button class="filter-button active" data-filter="all">All Courses</button>
            </div>
        `;
    }
    
    // Create summary HTML
    let summaryHTML = `
        ${filterHTML}
        <div class="summary-title">Course Summary</div>
        <div class="summary-stats">
            <div class="summary-item">
                <div class="summary-label">Total Courses</div>
                <div class="summary-value">${totalCourses}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Credits</div>
                <div class="summary-value">${totalCredits.toFixed(1)}</div>
            </div>
        `;
    
    // Add course count by year
    for (const year in coursesByYear) {
        summaryHTML += `
            <div class="summary-item">
                <div class="summary-label">${year} Year Courses</div>
                <div class="summary-value">${coursesByYear[year]}</div>
            </div>
        `;
    }
    
    // Add credits by year
    for (const year in creditsByYear) {
        summaryHTML += `
            <div class="summary-item">
                <div class="summary-label">${year} Year Credits</div>
                <div class="summary-value">${creditsByYear[year].toFixed(1)}</div>
            </div>
        `;
    }
    
    summaryHTML += '</div>';
    summaryContainer.innerHTML = summaryHTML;
}

function setupSearch(allCourses) {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm === '') {
            // If search is empty, show all courses
            displayCourses(allCourses);
            return;
        }
        
        // Filter courses based on search term
        const filteredCourses = allCourses.filter(course => {
            return course.code.toLowerCase().includes(searchTerm) ||
                   course.description.toLowerCase().includes(searchTerm) ||
                   course.year_level.toLowerCase().includes(searchTerm) ||
                   course.sem.toLowerCase().includes(searchTerm);
        });
        
        // Display filtered courses
        displayCourses(filteredCourses);
    });
}

function setupFilters() {
    // Create buttons for each year
    const years = [...new Set(window.allCourses.map(course => course.year_level))];
    
    const filterOptions = document.querySelector('.filter-options') || 
                          document.createElement('div');
    
    if (!document.querySelector('.filter-options')) {
        filterOptions.className = 'filter-options';
        filterOptions.innerHTML = '<button class="filter-button active" data-filter="all">All Courses</button>';
        
        // Add year filter buttons
        years.forEach(year => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.setAttribute('data-filter', year);
            button.textContent = `${year} Year`;
            filterOptions.appendChild(button);
        });
        
        document.getElementById('summary-container').prepend(filterOptions);
        
        // Add event listeners for filter buttons
        document.querySelectorAll('.filter-button').forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                document.querySelectorAll('.filter-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                
                const filter = this.getAttribute('data-filter');
                
                if (filter === 'all') {
                    displayCourses(window.allCourses);
                } else {
                    const filteredCourses = window.allCourses.filter(course => 
                        course.year_level === filter
                    );
                    displayCourses(filteredCourses);
                }
            });
        });
    }
}