pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        EC2_HOST       = '16.170.215.135'
        EC2_USER       = 'ec2-user'
        SSH_CREDENTIAL = 'aws-ec2-ssh'

        IMAGE_NAME     = 'rahman-one'
        CONTAINER_NAME = 'rahman-one'
        HOST_PORT      = '80'
        CONTAINER_PORT = '80'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .
                    docker save -o image.tar ${IMAGE_NAME}:${BUILD_NUMBER}
                '''
            }
        }

        stage('Test EC2 Connection') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            ${EC2_USER}@${EC2_HOST} \
                            "hostname && sudo docker --version"
                    '''
                }
            }
        }

        stage('Transfer Image') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        scp -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            image.tar \
                            ${EC2_USER}@${EC2_HOST}:/tmp/image.tar
                    '''
                }
            }
        }

        stage('Deploy NGINX Website') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            ${EC2_USER}@${EC2_HOST} '
                                sudo docker load -i /tmp/image.tar &&
                                (sudo docker rm -f rahman-one || true) &&
                                sudo docker run -d \
                                    --name rahman-one \
                                    --restart unless-stopped \
                                    -p 80:80 \
                                    rahman-one:'"${BUILD_NUMBER}"'
                            '
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            ${EC2_USER}@${EC2_HOST} \
                            "sudo docker ps --filter name=rahman-one &&
                             curl -I http://localhost"
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'rm -f image.tar'
        }
        success {
            echo 'NGINX website deployed successfully!'
        }
        failure {
            echo 'Deployment failed. Check the stage error in Console Output.'
        }
    }
}