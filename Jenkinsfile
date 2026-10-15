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

        IMAGE_NAME     = 'myapp'
        CONTAINER_NAME = 'myapp'

        HOST_PORT      = '8080'
        CONTAINER_PORT = '8080'
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
                    docker build \
                        -t ${IMAGE_NAME}:${BUILD_NUMBER} .

                    docker save \
                        -o image.tar \
                        ${IMAGE_NAME}:${BUILD_NUMBER}
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

        stage('Transfer Image to EC2') {
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

        stage('Deploy on EC2') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            ${EC2_USER}@${EC2_HOST} "
                                sudo docker load -i /tmp/image.tar &&
                                (sudo docker rm -f ${CONTAINER_NAME} || true) &&
                                sudo docker run -d \
                                    --name ${CONTAINER_NAME} \
                                    --restart unless-stopped \
                                    -p ${HOST_PORT}:${CONTAINER_PORT} \
                                    ${IMAGE_NAME}:${BUILD_NUMBER}
                            "
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
                            ${EC2_USER}@${EC2_HOST} "
                                sudo docker ps \
                                    --filter name=${CONTAINER_NAME}
                            "
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
            echo 'Deployment completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check the failed stage in Console Output.'
        }
    }
}