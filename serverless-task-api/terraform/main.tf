terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "task-api-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Action = "sts:AssumeRole"

      Effect = "Allow"

      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# CloudWatch Logging Permissions
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function
resource "aws_lambda_function" "task_api" {

  filename      = "../lambda.zip"

  function_name = var.lambda_function_name

  role = aws_iam_role.lambda_role.arn


  handler = "src/handler.createTask"
  runtime = "nodejs22.x"

  source_code_hash = filebase64sha256("../lambda.zip")

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic
  ]
}


resource "aws_dynamodb_table" "tasks" {
  name         = "Tasks"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "taskId"

  attribute {
    name = "taskId"
    type = "S"
  }
}

resource "aws_iam_role_policy" "dynamodb_access" {

  name = "task-api-dynamodb-access"

  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan"
      ]

      Resource = aws_dynamodb_table.tasks.arn
    }]
  })
}