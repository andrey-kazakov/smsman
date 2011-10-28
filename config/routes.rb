Smsgate::Application.routes.draw do
  devise_for :users

  resources :orders, :except => [:edit, :update] do
    member do
      get 'accept'
      delete 'accept'
    end
  end

  resources :users, :only => [:index, :show, :update] do
    member do
      get 'admin'
      delete 'admin'
    end
  end

  root :to => 'pages#index'
end
