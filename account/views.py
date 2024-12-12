from django.shortcuts import redirect, render

from .forms import CreateUserForm, LoginForm

from django.contrib.auth.models import User
from django.contrib import messages

from django.contrib.sites.shortcuts import get_current_site

from . token import user_tokenizer_generate

from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from django.contrib.auth.models import auth

from django.contrib.auth import authenticate, login, logout

from django.contrib.auth.decorators import login_required


def register(request):
    
    form = CreateUserForm()
    
    if request.method == 'POST':
        
        form = CreateUserForm(request.POST)
        
        if form.is_valid():
            
            user = form.save()
            
            user.is_active = False
        
            user.save()
            
            # email verification setup
            
            current_site = get_current_site(request)
            
            subject = 'Account verification email'
            
            message = render_to_string('account/registration/email-verification.html', { 
                'user': user,
                'domain': current_site.domain,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': user_tokenizer_generate.make_token(user),
            })
            
            
            user.email_user(subject=subject, message=message)
            
            
            return redirect('email-verification-sent')
            
            
            
        
    context = {'form': form}
    
    return render(request, 'account/registration/register.html', context=context)
    
def email_verification(request, uidb64, token):
    
    #unique id
    
    unique_id = force_str(urlsafe_base64_decode(uidb64))
    user = User.objects.get(pk=unique_id)
    
    # success
    
    if user and user_tokenizer_generate.check_token(user, token):
        
        user.is_active = True
        
        user.save()
        
        return redirect('email-verification-success')
    
    # failed
    
    else:
        
        return redirect('email-verification-failed')
    

def email_verification_sent(request):
    
    return render(request, 'account/registration/email-verification-sent.html')

def email_verification_success(request):
    
    return render(request, 'account/registration/email-verification-success.html')


def email_verification_failed(request):
    
    return render(request, 'account/registration/email-verification-failed.html')


def my_login(request):
    
    form = LoginForm()
    
    if request.method == 'POST':
        
        
        form = LoginForm(request, data=request.POST)
        
        if form.is_valid():
                        
            username = request.POST.get('username')
            password = request.POST.get('password')
            
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                                
                auth.login(request, user)
                
                return redirect("dashboard")
        

        
    
    
    context = {'form': form}
    
    if not form.is_valid():
        context['form_errors'] = form.errors
    return render(request, 'account/my-login.html', context=context)


#logout

def user_logout(request):
    
    auth.logout(request)
    
    return redirect("store")


@login_required(login_url='my-login')
def dashboard(request):
    
    return render(request, 'account/dashboard.html')