# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

require 'json'

module LambdaFunctions
  class Handler
    def self.process(event:,context:)
      nameQuery = event.dig("queryStringParameters", "name")
      name = nameQuery || "World"

      {
        statusCode: 200,
        headers: {
          'Content-Type' => 'text/plain'
        },
        body: "Hello, #{name}!",
      }
    end
  end
end
