<!DOCTYPE html>
<html lang="en" class="bg-base text-text">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Mewxus') — mewxus</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="font-sans font-semibold text-text bg-base min-h-screen antialiased">
    @yield('content')
</body>
</html>
