class OrdersController < ApplicationController
  include OrdersHelper

  before_filter :authenticate_user!
  before_filter :verify_admin, :only => :accept

  # GET /orders
  # GET /orders.json
  def index
    @orders = orders.order_by case params[:order]
                              when 'accepted' then :accepted
                              else :created_at
                              end

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @orders }
    end
  end

  # GET /orders/1
  # GET /orders/1.json
  def show
    @order = orders.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @order }
    end
  end

  # GET /orders/new
  # GET /orders/new.json
  def new
    # FIXME: быдлокод
    types = Order.types.invert
    classname = params[:_type].presence
    klass = Object.const_get(classname) if types.keys.map(&:name).include?(classname)
    @order = (klass || Order).new 

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @order }
    end
  end

  # GET /orders/1/edit
  #def edit
  #  @order = orders.find(params[:id])
  #end

  # POST /orders
  # POST /orders.json
  def create
    # FIXME: быдлокод
    types = Order.types.invert
    classname = params[:_type].presence
    klass = Object.const_get(classname) if types.keys.map(&:name).include?(classname)
    current_user.orders << (@order = klass.new(params[types[klass]+'_order']))

    respond_to do |format|
      if @order.save
        format.html { redirect_to @order, notice: 'Order was successfully created.' }
        format.json { render json: @order, status: :created, location: @order }
      else
        format.html { render action: "new" }
        format.json { render json: @order.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /orders/1
  # PUT /orders/1.json
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

  # DELETE /orders/1
  # DELETE /orders/1.json
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
