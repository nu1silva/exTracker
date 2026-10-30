<?php

// HTML-escape a value for output.
function h($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function redirect($location)
{
    header("Location: " . $location);
    exit;
}

// Redirect back to $page with a message shown by show_messages().
function redirect_with($page, $type, $message)
{
    redirect($page . '?' . http_build_query(array($type => $message)));
}

function show_messages()
{
    if (!empty($_GET['error'])) {
        echo '<div style="padding-left:50px; font-size:15px; color:#FF0000;">' . h($_GET['error']) . '</div>';
    }
    if (!empty($_GET['success'])) {
        echo '<div style="padding-left:50px; font-size:15px; color:#19aa2f;">' . h($_GET['success']) . '</div>';
    }
}

function csrf_token()
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field()
{
    return '<input type="hidden" name="csrf_token" value="' . h(csrf_token()) . '"/>';
}

// Stop unless this is a POST carrying this session's CSRF token.
function require_post_with_csrf()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST'
        || !hash_equals(csrf_token(), (string)($_POST['csrf_token'] ?? ''))) {
        http_response_code(400);
        exit('Invalid request');
    }
}

// Current page number from ?pagenum=, clamped to [1, $last].
function current_page($last)
{
    $page = (int)($_GET['pagenum'] ?? 1);
    return max(1, min($page, max(1, $last)));
}

function render_pagination($baseUrl, $current, $last)
{
    $link = function ($page, $label, $class = '', $title = '') use ($baseUrl) {
        return '<a class="' . $class . '" title="' . h($title ?: $page) . '" href="' . h($baseUrl . '?pagenum=' . $page) . '">' . $label . '</a>';
    };
    $html = '';

    if ($current != 1) {
        $html .= $link(1, '&laquo;', 'first', 'First');
        $html .= $link($current - 1, 'Previous', 'first', 'Previous');
    } else {
        $html .= '<span class="disabled first" title="First">&laquo;</span>';
        $html .= '<span class="disabled first" title="Previous">Previous</span>';
    }
    for ($i = 1; $i <= $last; $i++) {
        $html .= ($i != $current) ? $link($i, $i) : '<span class="current">' . $i . '</span>';
    }
    if ($current != $last) {
        $html .= $link($current + 1, 'Next', 'next', 'Next');
        $html .= $link($last, '&raquo;', 'last', 'Last');
    } else {
        $html .= '<span class="disabled next" title="Next">Next</span>';
        $html .= '<span class="disabled last" title="Last">&raquo;</span>';
    }
    return '<div class="pagination">' . $html . '</div>';
}
