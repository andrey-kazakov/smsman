class OrdersController < ApplicationController
  include OrdersHelper

  before_filter :authenticate_user!
  before_filter :verify_admin, :only => :accept

  respond_to :html, :json

  def index
    @orders = orders.order_by case params[:order]
                              when 'accepted' then :accepted
                              when 'paid' then :paid
                              else :created_at
                              end

    respond_to do |format|
      format.html
      format.json { render json: @orders }
    end
  end

  def show
    @order = orders.find(params[:id])

    respond_to do |format|
      format.html
      format.json { render json: @order }
    end
  end

  def new
    types = Order.types.invert
    classname = params[:type].presence

    if types.keys.map(&:name).include?(classname)
      @order = classname.constantize.new
    else
      @order = Order.new
    end

    respond_to do |format|
      format.html
      format.json { render json: @order }
    end
  end

  #def edit
  #  @order = orders.find(params[:id])
  #end

  def create
    # FIXME: быдлокод
    types = Order.types.invert
    classname = params[:_type].presence

    respond_to do |format|
      if types.keys.map(&:name).include?(classname)
        klass = classname.constantize.new
        current_user.orders << (@order = klass.new(params[types[klass]+'_order']))

        if @order.save
          format.html { redirect_to @order, notice: t('order_created_notice') }
          format.json { render json: @order, status: :created, location: @order }
        else
          format.html { render action: "new" }
          format.json { render json: @order.errors, status: :unprocessable_entity }
        end
      else
        format.html { render action: "new" }
        format.json { render json: @order.errors, status: :unprocessable_entity }
      end
    end
  end

  #def update
  #  @order = orders.find(params[:id])

  #  respond_to do |format|
  #    if @order.update_attributes(params[:order])
  #      format.html { redirect_to @order, notice: 'Order was successfully updated.' }
  #      format.json { head :ok }
  #    else
  #      format.html { render action: "edit" }
  #      format.json { render json: @order.errors, status: :unprocessable_entity }
  #    end
  #  end
  #end

  def destroy
    @order = orders.find(params[:id])
    @order.destroy

    respond_to do |format|
      format.html { redirect_to orders_url }
      format.js { render :js => %<$('#order_#{@order.id}').remove()> }
    end
  end

  def accept
    @order = orders.find(params[:id])
    warn 'orders#accept called, model response: ' + (request.delete? ? @order.decline! : @order.accept!).to_s

    respond_to do |format|
      format.html { redirect_to orders_url }
      format.js { render :js => %<$('#order_#{@order.id} .accepted').text('#{request.delete? ? 'no' : 'yes'}')> }
    end
  end
end
