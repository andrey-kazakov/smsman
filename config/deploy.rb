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
set :bundle_flags, "--deployment --quiet --binstubs --shebang ruby-local-exec"

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
  task :copy_configs do
    run "cp #{shared_path}/config/* #{release_path}/config"
  end

  task :restart do
    run "/etc/init.d/smsman stop;/etc/init.d/smsman start"
  end
end

after 'deploy:update_code', 'deploy:copy_configs'
after "deploy:update_code", "deploy:migrate"

after "deploy:setup", "deploy:assets:clean"
after "deploy:setup", "deploy:assets:precompile"

after :deploy, "deploy:restart"
