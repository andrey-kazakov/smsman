load 'deploy/assets'

set :stages, %w(production)
set :default_stage, "production"

set :application, "smsman"
role :web, "smsman.myhotspot.ru"                          
role :app, "smsman.myhotspot.ru"
set :port, 2122
set :repository,  "git@github.com:reflow/smsman.git"
set :deploy_to, "/var/rails/smsman"
set :deploy_via, :remote_cache
set :branch, 'develop'
set :scm, :git
set :scm_verbose, true
set :use_sudo, false
set :unicorn_script, "/etc/init.d/smsman"

set :bundle_flags, "--deployment --quiet --binstubs"

default_run_options[:pty] = true
ssh_options[:user] = "deploy"
ssh_options[:forward_agent] = true

# For rbenv
set :default_environment, { 
  'PATH' => "/home/deploy/.rvm/rubies/ruby-1.9.2-p290/bin/:/home/deploy/.rvm/gems/ruby-1.9.2-p290/bin:/home/deploy/.rvm/bin:$PATH",
  'RUBY_VERSION' => 'ruby 1.9.2-p290',
  'GEM_HOME' => '/home/deploy/.rvm/gems/ruby-1.9.2-p290/',
  'GEM_PATH' => '/home/deploy/.rvm/gems/ruby-1.9.2-p290/' 
}

namespace :deploy do
  task :bundle do
    run "cd #{current_release} && bundle install"
  end

  task :copy_configs do
    run "ln -nfs #{shared_path}/config/robokassa_merchant.yml #{release_path}/config/robokassa_merchant.yml"
    run "ln -nfs #{shared_path}/config/mongoid.yml #{release_path}/config/mongoid.yml"
    run "ln -nfs #{shared_path}/config/unicorn.rb #{release_path}/config/unicorn.rb"
  end

  task :restart do
    run "/etc/init.d/smsman stop;/etc/init.d/smsman start"
  end
end

after 'deploy:finalize_update', 'deploy:copy_configs'
after "deploy:finalize_update", "deploy:migrate"

before "deploy:assets:precompile", "deploy:bundle"

after "deploy:setup", "deploy:assets:clean"
after "deploy:setup", "deploy:assets:precompile"

after :deploy, "deploy:restart"
