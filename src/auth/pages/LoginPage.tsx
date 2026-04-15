import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { login } from '@/http/Services/auth';
import { useTokenStore, useUserDetailStore } from '@/store/store';
import { showError, showSuccess } from '@/utility/utility';
import { Eye, EyeOff } from 'lucide-react';

import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import * as z from 'zod';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const setToken = useTokenStore((state) => state.setToken);
  const setUserDetails = useUserDetailStore((state) => state.setUserDetail);

  // mutation
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data: any) => {
      const userData = data?.data?.admin;
      const token = data?.headers?.authorization;
      console.log('token: ', token);
      setToken(token);
      setUserDetails(userData);
      showSuccess('Welcome to dashboard');
    },

    onError: (error: any) => {
      console.log('error: ', error);
      showError(error?.response?.data?.message);
    },
  });

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      const payload: any = { ...value };
      mutation.mutate(payload);
    },
  });

  return (
    <section className="flex justify-center w-screen items-center h-screen">
      <Card className="w-full max-w-sm ">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <form
            id="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmitted(true);
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="email"
                validators={{
                  onSubmit: z
                    .string()
                    .refine(
                      (val) => {
                        if (val.trim() === '') {
                          return false;
                        }
                        return true;
                      },
                      { message: 'Email is required' }
                    )
                    .refine(
                      (val) => {
                        if (val.trim() === '') {
                          return true; // Skip this check if empty (handled by previous)
                        }
                        return z.string().email().safeParse(val).success;
                      },
                      { message: 'Invalid email address' }
                    ),
                  onChange: isSubmitted
                    ? z
                        .string()
                        .refine(
                          (val) => {
                            if (val.trim() === '') {
                              return false;
                            }
                            return true;
                          },
                          { message: 'Email is required' }
                        )
                        .refine(
                          (val) => {
                            if (val.trim() === '') {
                              return true; // Skip this check if empty (handled by previous)
                            }
                            return z.string().email().safeParse(val).success;
                          },
                          { message: 'Invalid email address' }
                        )
                    : undefined,
                }}
                children={(field) => {
                  const isInvalid = isSubmitted && field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          // Re-validate on change after first submit to clear errors when valid
                          if (isSubmitted) {
                            field.validate('change');
                          }
                        }}
                        aria-invalid={isInvalid}
                        placeholder="admin@admin.com"
                        autoComplete="off"
                      />
                      {isInvalid && field.state.meta.errors.length > 0 && (
                        <FieldError
                          errors={[
                            typeof field.state.meta.errors[0] === 'string'
                              ? { message: field.state.meta.errors[0] }
                              : field.state.meta.errors[0],
                          ]}
                        />
                      )}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="password"
                validators={{
                  onSubmit: z.string().min(1, 'Password is required'),
                  onChange: isSubmitted
                    ? z.string().min(1, 'Password is required')
                    : undefined,
                }}
                children={(field) => {
                  const isInvalid = isSubmitted && field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <div className="relative">
                        <Input
                          id={field.name}
                          name={field.name}
                          type={showPassword ? 'text' : 'password'}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            // Re-validate on change after first submit to clear errors when valid
                            if (isSubmitted) {
                              field.validate('change');
                            }
                          }}
                          aria-invalid={isInvalid}
                          placeholder="Enter your password"
                          autoComplete="off"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {isInvalid && field.state.meta.errors.length > 0 && (
                        <FieldError
                          errors={[
                            typeof field.state.meta.errors[0] === 'string'
                              ? { message: field.state.meta.errors[0] }
                              : field.state.meta.errors[0],
                          ]}
                        />
                      )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full cursor-pointer" form="login-form">
            Login
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
};

export default LoginPage;
