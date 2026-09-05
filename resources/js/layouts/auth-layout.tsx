import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    greeting,
    children,
}: {
    title?: string;
    description?: string;
    greeting?: string;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description} greeting={greeting}>
            {children}
        </AuthLayoutTemplate>
    );
}
