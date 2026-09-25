pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo 'Checking out source code from Git...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing server dependencies with npm ci...'
                sh '''
                    cd server
                    npm ci --omit=dev
                '''
            }
        }

        stage('Lint & Health Validation') {
            steps {
                echo 'Validating JavaScript syntax and application configuration...'
                sh '''
                    node -c ecosystem.config.js
                    node -c server/server.js
                    node -c server/app.js
                '''
            }
        }

        stage('Deploy to PM2') {
            steps {
                echo 'Deploying application via PM2 with zero downtime...'
                sh '''
                    # If production directory exists, update it to match current commit
                    if [ -d "/home/ubuntu/group-chat-app" ]; then
                        echo "Updating production app at /home/ubuntu/group-chat-app..."
                        cd /home/ubuntu/group-chat-app
                        git fetch origin main
                        git reset --hard origin/main
                        cd server && npm ci --omit=dev && cd ..
                    fi

                    # Zero-downtime hot reload under ubuntu user
                    if sudo -u ubuntu pm2 describe group-chat-app > /dev/null 2>&1; then
                        echo "Reloading existing PM2 process with zero downtime..."
                        sudo -u ubuntu pm2 reload ecosystem.config.js --update-env
                    elif pm2 describe group-chat-app > /dev/null 2>&1; then
                        pm2 reload ecosystem.config.js --update-env
                    else
                        echo "Starting application with PM2..."
                        sudo -u ubuntu pm2 start ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
                    fi
                    
                    sudo -u ubuntu pm2 save || pm2 save || true
                '''
            }
        }

        stage('Post-Deployment Health Probe') {
            steps {
                echo 'Executing HTTP health check probe...'
                sh '''
                    sleep 3
                    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/api/health)
                    
                    if [ "$STATUS_CODE" -eq 200 ]; then
                        echo "Health check PASSED! Status code: $STATUS_CODE"
                    else
                        echo "Health check FAILED! Received HTTP status: $STATUS_CODE"
                        sudo -u ubuntu pm2 logs group-chat-app --lines 40 --nostream || true
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        success {
            echo "Deployment succeeded! Group Chat App is live and running."
        }
        failure {
            echo "Deployment failed! Printing recent PM2 error logs..."
            sh 'sudo -u ubuntu pm2 logs group-chat-app --err --lines 50 --nostream || true'
        }
    }
}
