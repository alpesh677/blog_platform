/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './views/**/*.ejs', // Include all EJS templates in the 'views' folder
        './public/**/*.html', // Optional: Include public HTML files if applicable
    ],
    theme: {
        colors: {
            primary: '#3490dc',
            secondary: '#ffed4a',
            danger: '#e3342f',
        },
    },
    plugins: [],
};
