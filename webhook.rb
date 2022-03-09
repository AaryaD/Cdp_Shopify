# The following example uses Ruby and the Sinatra web framework to verify a webhook request:

require 'rubygems'
require 'base64'
require 'openssl'
require 'sinatra'
require 'active_support/security_utils'
require 'shopify_api'

get '/' do
  "Hello, world!"
end

# The Shopify app's API secret key, viewable from the Partner Dashboard. In a production environment, set the API secret key as an environment variable to prevent exposing it in code.
SHARED_SECRET_KEY = '43dbc57e209d945387f464ed26c5254c41ed84be48c7f82153fd90da1de1552e'
API_KEY = '9409c693fe056fb65fa52a142e3ebaa0'
ShopifyAPI:: Session.setup(api_key: API_KEY, secret: SHARED_SECRET_KEY)
puts "************"

helpers do
  puts "hello"
  # Compare the computed HMAC digest based on the API secret key and the request contents to the reported HMAC in the headers
  def verify_webhook(data, hmac_header)
    calculated_hmac = Base64.strict_encode64(OpenSSL::HMAC.digest('sha256', SHARED_SECRET_KEY, data))
    unless ActiveSupport::SecurityUtils.secure_compare(calculated_hmac, hmac_header)
      return [403,'Authorization failed; prvided HMAC was #{hmac_header}']
    end
  end
end
puts "Hello"
# Respond to HTTP POST requests sent to this web service
post '/webhooks' do
  puts "Hello"
  request.body.rewind
  data = request.body.read
  verified = verify_webhook(data, env["HTTP_X_SHOPIFY_HMAC_SHA256"])
  #Output true or false
  puts "Webhook verified: #{verified}"
  json_data = JSON.parse data
  product = ShopifyAPI::Product.find(json_data['id'].to_i)
  product.tags += ',updated'
  product.save
  return [200,'Webhook successfully received']

end 

post '/webhooks/product_update' do
  request.body.rewind 
  data = request.body.read
  verified = verify_webhook(data, env["HTTP_X_SHOPIFY_HMAC_SHA256"])
    
  #Output true or false
  puts "Webhook verified: #{verified}"
   
end