pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        ansiColor('xterm')
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
                    # Check if PM2 process exists
                    if pm2 describe group-chat-app > /dev/null 2>&1; then
                        echo "Group chat app is running. Performing zero-downtime hot reload..."
                        pm2 reload ecosystem.config.js --update-env
                    else
                        echo "Starting application with PM2..."
                        pm2 start ecosystem.config.js --env production
                    fi
                    
                    # Persist PM2 state across system reboots
                    pm2 save
                '''
            }
        }

        stage('Post-Deployment Health Probe') {
            steps {
                echo 'Executing HTTP health check probe...'
                sh '''
                    # Wait 3 seconds for worker readiness
                    sleep 3
                    
                    # Probe health endpoint on local loopback
                    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/api/health)
                    
                    if [ "$STATUS_CODE" -eq 200 ]; then
                        echo "Health check PASSED! Status code: $STATUS_CODE"
                    else
                        echo "Health check FAILED! Received HTTP status: $STATUS_CODE"
                        pm2 logs group-chat-app --lines 40 --nostream
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
            sh 'pm2 logs group-chat-app --err --lines 50 --nostream || true'
        }
    }
}

