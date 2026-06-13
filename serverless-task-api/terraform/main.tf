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
resource "aws_apigatewayv2_api" "task_api" {
  name          = "task-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]

    allow_methods = [
      "GET",
      "POST",
      "DELETE",
      "OPTIONS"
    ]

    allow_headers = [
      "content-type"
    ]

    max_age = 300
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.task_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.task_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_tasks" {
  api_id    = aws_apigatewayv2_api.task_api.id
  route_key = "GET /tasks"

  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.task_api.id
  name        = "$default"
  auto_deploy = true
}
resource "aws_lambda_permission" "api_gateway" {

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.task_api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.task_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "create_task" {
  api_id    = aws_apigatewayv2_api.task_api.id
  route_key = "POST /tasks"

  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "delete_task" {
  api_id    = aws_apigatewayv2_api.task_api.id
  route_key = "DELETE /tasks/{id}"

  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}
resource "aws_apigatewayv2_route" "update_task" {
  api_id    = aws_apigatewayv2_api.task_api.id
  route_key = "PUT /tasks/{id}"

  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}
