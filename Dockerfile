# Use the Nginx base image
FROM nginx:latest

# Copy the static landing page
COPY homepage /usr/share/nginx/homepage

# Copy the React app build files
COPY react-app/build /usr/share/nginx/react-app

# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
