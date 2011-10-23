$:.unshift(File.expand_path('./lib', ENV['rvm_path']))

require 'rvm/capistrano' # Для работы rvm
#require 'bundler/capistrano'
load 'deploy/assets'

set :stages, %w(production)
set :default_stage, "staging"

set :rvm_ruby_string, '1.9.2-p290'
set :rvm_type, :user

set :application, "smsman"
role :web, "smsman.myhotspot.ru"                          
role :app, "smsman.myhotspot.ru"
set :port, 2122
set :repository,  "git@github.com:reflow/smsman.git"
set :deploy_to, "/var/rails/smsman"
set :deploy_via, :remote_cache
set :branch, 'master'
set :scm, :git
set :scm_verbose, true
set :use_sudo, false
set :unicorn_script, "/etc/init.d/smsman"


# require multistage. must be here! 
#require 'capistrano/ext/multistage'

default_run_options[:pty] = true
ssh_options[:user] = "deploy"
ssh_options[:forward_agent] = true


namespace :deploy do  
  task :bundle do
    run "cd #{deploy_to}/current/ && bundle install"
  end


 task :restart do
  run "/etc/init.d/smsman restart"
 end


end

  before :deploy, "deploy:bundle"
  after :deploy, "deploy:restart"
