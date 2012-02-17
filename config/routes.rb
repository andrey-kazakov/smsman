Smsgate::Application.routes.draw do
  devise_for :users

  get '/faq' => 'pages#faq', as: :faq
  get '/buckets' => 'pages#buckets', as: :buckets
  get '/prices' => 'pages#prices', as: :prices
  get '/contacts' => 'pages#contacts', as: :contacts
  get '/explore' => 'pages#explore', as: :explore

  resources :orders, except: [:edit, :update] do
    member do
      get 'accept'
      delete 'accept'
    end
    
    get '/new/:type' => 'orders#new', on: :collection, as: 'new_with_type'
  end

  match '/profile' => 'users#profile', as: :profile
  resources :users, only: [:index, :show, :update] do
    member do
      get 'admin'
      delete 'admin'
    end
  end

  # get '/toggle_language' => 'application#toggle_language'

  root :to => 'pages#index'
end
