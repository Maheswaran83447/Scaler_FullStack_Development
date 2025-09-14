# Best Practices for Making a Web Page Responsive

## 1. Mobile-First Design

- Start designing for smaller screens first and progressively enhance for larger screens using media queries.

```css
/* Base styles for mobile */
body {
  font-size: 16px;
}

/* Adjust for tablets */
@media (min-width: 768px) {
  body {
    font-size: 18px;
  }
}

/* Adjust for desktops */
@media (min-width: 1024px) {
  body {
    font-size: 20px;
  }
}
```
