# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

resource "random_pet" "api_gateway_name" {
  prefix = "hello-world-lambda-gw"
  length = 2
}

 resource "aws_apigatewayv2_api" "lambda" {
   name          = random_pet.api_gateway_name.id
   protocol_type = "HTTP"
 }

 resource "aws_apigatewayv2_stage" "lambda" {
   api_id = aws_apigatewayv2_api.lambda.id

   name        = "serverless_lambda_stage"
   auto_deploy = true

   access_log_settings {
     destination_arn = aws_cloudwatch_log_group.api_gw.arn

     format = jsonencode({
       requestId               = "$context.requestId"
       sourceIp                = "$context.identity.sourceIp"
       requestTime             = "$context.requestTime"
       protocol                = "$context.protocol"
       httpMethod              = "$context.httpMethod"
       resourcePath            = "$context.resourcePath"
       routeKey                = "$context.routeKey"
       status                  = "$context.status"
       responseLength          = "$context.responseLength"
       integrationErrorMessage = "$context.integrationErrorMessage"
       }
     )
   }
 }

 resource "aws_apigatewayv2_integration" "hello_world" {
   api_id = aws_apigatewayv2_api.lambda.id

   integration_uri    = var.lambda_invoke_arn
   integration_type   = "AWS_PROXY"
   integration_method = "POST"
 }

 resource "aws_apigatewayv2_route" "hello_world" {
   api_id = aws_apigatewayv2_api.lambda.id

   route_key = "GET /hello"
   target    = "integrations/${aws_apigatewayv2_integration.hello_world.id}"
 }

 resource "aws_cloudwatch_log_group" "api_gw" {
   name = "/aws/api_gw/${aws_apigatewayv2_api.lambda.name}"

   retention_in_days = 30
 }

 resource "aws_lambda_permission" "api_gw" {
   statement_id  = "AllowExecutionFromAPIGateway"
   action        = "lambda:InvokeFunction"
   function_name = var.lambda_function_name
   principal     = "apigateway.amazonaws.com"

   source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
 }
