Smsgate::Application.routes.draw do
  devise_for :users

  resources :orders, except: [:edit, :update] do
    member do
      get 'accept'
      delete 'accept'
    end
    
    get '/new/:type' => 'orders#new', on: :collection, as: 'new_with_type'
  end

  resources :users, only: [:index, :show, :update] do
    member do
      get 'admin'
      delete 'admin'
    end
  end

  # get '/toggle_language' => 'application#toggle_language'

  root :to => 'pages#index'
end
