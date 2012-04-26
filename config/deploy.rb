#$:.unshift(File.expand_path('./lib', ENV['rvm_path'])) # Add RVM's lib directory to the load path.
#require "rubygems"
#require "rvm/capistrano"                  # Load RVM's capistrano plugin.
require 'bundler/capistrano'
load 'deploy/assets'

set :stages, %w(production)
set :default_stage, "production"

set :application, "smsman"
role :web, "smsman.myhotspot.ru"                          
role :app, "smsman.myhotspot.ru"
set :port, 2122
set :repository,  "git@github.com:myhotspot/smsman.git"
set :deploy_to, "/var/rails/smsman"
set :deploy_via, :remote_cache
set :branch, 'master'
set :scm, :git
set :scm_verbose, true
set :use_sudo, false
set :unicorn_script, "/etc/init.d/smsman"

set :rvm_ruby_string, 'ruby-1.9.3-p125'
set :rvm_type, :user

set :bundle_flags, "--deployment --quiet --binstubs"

set :rvm_path,              "/home/deploy/.rvm"
set :rvm_bin_path,      "#{rvm_path}/bin"
set :rvm_lib_path,      "#{rvm_path}/lib"

set :bundle_cmd, "#{rvm_path}/gems/#{rvm_ruby_string}/bin/bundle"

set :default_environment, {
  'PATH' => "#{rvm_path}/bin:#{rvm_path}/gems/#{rvm_ruby_string}/bin:#{rvm_path}/rubies/#{rvm_ruby_string}/bin:$PATH",
  'GEM_HOME' => "#{rvm_path}/gems/#{rvm_ruby_string}",
  'GEM_PATH' => "#{rvm_path}/gems/#{rvm_ruby_string}"
}

default_run_options[:pty] = true
ssh_options[:user] = "deploy"
ssh_options[:forward_agent] = true

namespace :deploy do
  task :copy_configs do
    run "ln -nfs #{shared_path}/config/robokassa_merchant.yml #{release_path}/config/robokassa_merchant.yml"
    run "ln -nfs #{shared_path}/config/mongoid.yml #{release_path}/config/mongoid.yml"
    run "ln -nfs #{shared_path}/config/unicorn.rb #{release_path}/config/unicorn.rb"
  end

  task :restart do
    run %Q{
      /etc/init.d/smsman stop;
      /etc/init.d/smsman start;
    }
  end
end

after 'deploy:finalize_update', 'deploy:copy_configs'
