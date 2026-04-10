import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { loginUser } from "../authSlice";
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak")
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-300 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="card w-full max-w-[420px] bg-base-100/60 backdrop-blur-xl shadow-2xl border border-base-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out z-10">
        <div className="card-body p-8 sm:p-10">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
              Welcome back
            </h1>
            <p className="text-base-content/60 font-medium tracking-wide">Enter your details to sign in</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="form-control group">
              <label className="label pb-1.5 pt-0">
                <span className="text-sm font-bold text-base-content/80 group-focus-within:text-primary transition-colors">Email Address</span>
              </label>
              <div className="relative flex items-center">
                <Mail className={`absolute left-4 w-5 h-5 transition-colors ${errors.emailId ? 'text-error/70' : 'text-base-content/40 group-focus-within:text-primary'}`} />
                <input
                  type="email"
                  placeholder="john@example.com"
                  className={`input w-full pl-12 bg-base-200/50 border-base-300 hover:border-base-content/20 focus:bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.emailId ? 'input-error focus:border-error focus:ring-error/20 bg-error/5' : ''}`}
                  {...register('emailId')}
                />
              </div>
              {errors.emailId && (
                <span className="text-error text-xs font-medium mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-error inline-block"></span>
                  {errors.emailId.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-control group">
              <label className="label pb-1.5 pt-0">
                <span className="text-sm font-bold text-base-content/80 group-focus-within:text-primary transition-colors">Password</span>
              </label>
              <div className="relative flex items-center">
                <Lock className={`absolute left-4 w-5 h-5 transition-colors ${errors.password ? 'text-error/70' : 'text-base-content/40 group-focus-within:text-primary'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input w-full pl-12 pr-12 bg-base-200/50 border-base-300 hover:border-base-content/20 focus:bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.password ? 'input-error focus:border-error focus:ring-error/20 bg-error/5' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 p-1.5 rounded-md text-base-content/40 hover:text-base-content hover:bg-base-200 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-error text-xs font-medium mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-error inline-block"></span>
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <div className="form-control mt-8">
              <button
                type="submit"
                className="btn btn-primary w-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner text-primary-content"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Signup Redirect */}
          <div className="text-center mt-6 pt-5 border-t border-base-content/10">
            <span className="text-sm text-base-content/70 font-medium">
              New to CodeKshetra AI?{' '}
              <NavLink to="/signup" className="link link-primary font-bold hover:link-secondary transition-colors inline-block hover:scale-105 active:scale-95">
                Create an account
              </NavLink>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
