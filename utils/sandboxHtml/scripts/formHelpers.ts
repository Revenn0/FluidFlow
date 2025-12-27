/**
 * Form Helpers Script
 *
 * Provides form validation utilities, auto-save functionality,
 * and form state management.
 */

/**
 * Generate the form helpers script for the sandbox
 */
export function getFormHelpersScript(): string {
  return `
    // ═══════════════════════════════════════════════════════════
    // FORM HELPERS
    // Validation, auto-save, and form state management
    // ═══════════════════════════════════════════════════════════

    (function() {
      // Common validation patterns
      var patterns = {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/,
        phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\\s./0-9]*$/,
        url: /^(https?:\\/\\/)?(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
        alphanumeric: /^[a-zA-Z0-9]+$/,
        numeric: /^[0-9]+$/,
        alpha: /^[a-zA-Z]+$/,
        slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        creditCard: /^[0-9]{13,19}$/,
        postalCode: /^[0-9]{5}(-[0-9]{4})?$/,
        ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        hexColor: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
        date: /^\\d{4}-\\d{2}-\\d{2}$/,
        time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$/
      };

      // Validation functions
      var validators = {
        required: function(value) {
          if (value === null || value === undefined) return false;
          if (typeof value === 'string') return value.trim().length > 0;
          if (Array.isArray(value)) return value.length > 0;
          return true;
        },

        minLength: function(value, min) {
          if (!value) return false;
          return String(value).length >= min;
        },

        maxLength: function(value, max) {
          if (!value) return true;
          return String(value).length <= max;
        },

        min: function(value, min) {
          var num = parseFloat(value);
          return !isNaN(num) && num >= min;
        },

        max: function(value, max) {
          var num = parseFloat(value);
          return !isNaN(num) && num <= max;
        },

        pattern: function(value, patternName) {
          if (!value) return true;
          var regex = patterns[patternName] || new RegExp(patternName);
          return regex.test(String(value));
        },

        email: function(value) {
          return !value || patterns.email.test(String(value));
        },

        url: function(value) {
          return !value || patterns.url.test(String(value));
        },

        match: function(value, otherValue) {
          return value === otherValue;
        },

        custom: function(value, fn) {
          return fn(value);
        }
      };

      // Validate a single field
      function validateField(value, rules) {
        var errors = [];

        for (var rule in rules) {
          var ruleValue = rules[rule];
          var validator = validators[rule];

          if (!validator) continue;

          var isValid;
          if (rule === 'minLength' || rule === 'maxLength' || rule === 'min' || rule === 'max' || rule === 'pattern' || rule === 'match') {
            isValid = validator(value, ruleValue);
          } else if (rule === 'custom') {
            isValid = validator(value, ruleValue);
          } else {
            isValid = validator(value);
          }

          if (!isValid) {
            errors.push({
              rule: rule,
              value: ruleValue,
              message: getErrorMessage(rule, ruleValue)
            });
          }
        }

        return {
          valid: errors.length === 0,
          errors: errors
        };
      }

      // Get default error message
      function getErrorMessage(rule, value) {
        var messages = {
          required: 'This field is required',
          minLength: 'Must be at least ' + value + ' characters',
          maxLength: 'Must be no more than ' + value + ' characters',
          min: 'Must be at least ' + value,
          max: 'Must be no more than ' + value,
          email: 'Please enter a valid email address',
          url: 'Please enter a valid URL',
          pattern: 'Please enter a valid format',
          match: 'Fields do not match',
          custom: 'Invalid value'
        };
        return messages[rule] || 'Invalid value';
      }

      // Validate entire form
      function validateForm(formData, schema) {
        var results = {};
        var isValid = true;

        for (var field in schema) {
          var value = formData[field];
          var rules = schema[field];
          var result = validateField(value, rules);

          results[field] = result;
          if (!result.valid) {
            isValid = false;
          }
        }

        return {
          valid: isValid,
          fields: results
        };
      }

      // Auto-save storage key prefix
      var AUTOSAVE_PREFIX = '__form_autosave_';

      // Auto-save form data
      function autoSave(formId, data) {
        try {
          var key = AUTOSAVE_PREFIX + formId;
          var saveData = {
            data: data,
            timestamp: Date.now()
          };
          localStorage.setItem(key, JSON.stringify(saveData));
          return true;
        } catch (e) {
          console.warn('[Form] Auto-save failed:', e.message);
          return false;
        }
      }

      // Restore auto-saved data
      function autoRestore(formId) {
        try {
          var key = AUTOSAVE_PREFIX + formId;
          var saved = localStorage.getItem(key);
          if (saved) {
            var parsed = JSON.parse(saved);
            // Check if data is not too old (24 hours)
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              return parsed.data;
            } else {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.warn('[Form] Auto-restore failed:', e.message);
        }
        return null;
      }

      // Clear auto-saved data
      function autoClear(formId) {
        try {
          var key = AUTOSAVE_PREFIX + formId;
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore
        }
      }

      // Get form data as object
      function getFormData(form) {
        if (!form) return {};

        var formData = new FormData(form);
        var data = {};

        formData.forEach(function(value, key) {
          // Handle multiple values (checkboxes, multi-select)
          if (data.hasOwnProperty(key)) {
            if (!Array.isArray(data[key])) {
              data[key] = [data[key]];
            }
            data[key].push(value);
          } else {
            data[key] = value;
          }
        });

        return data;
      }

      // Set form data from object
      function setFormData(form, data) {
        if (!form || !data) return;

        for (var key in data) {
          var elements = form.elements[key];
          if (!elements) continue;

          var value = data[key];

          // Handle NodeList (multiple elements with same name)
          if (elements.length !== undefined && elements.length > 0) {
            for (var i = 0; i < elements.length; i++) {
              var el = elements[i];
              if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = Array.isArray(value) ? value.includes(el.value) : el.value === value;
              }
            }
          } else {
            var el = elements;
            if (el.type === 'checkbox') {
              el.checked = Boolean(value);
            } else if (el.type === 'radio') {
              el.checked = el.value === value;
            } else {
              el.value = value || '';
            }
          }
        }
      }

      // Track form with auto-save
      function trackForm(form, formId, options) {
        options = options || {};
        var debounceTime = options.debounce || 1000;
        var timeout = null;

        // Restore saved data
        if (options.restore !== false) {
          var saved = autoRestore(formId);
          if (saved) {
            setFormData(form, saved);
            console.log('[Form] Restored auto-saved data for:', formId);
          }
        }

        // Listen for changes
        function handleChange() {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(function() {
            var data = getFormData(form);
            autoSave(formId, data);
          }, debounceTime);
        }

        form.addEventListener('input', handleChange);
        form.addEventListener('change', handleChange);

        // Clear on submit
        form.addEventListener('submit', function() {
          autoClear(formId);
        });

        return function untrack() {
          form.removeEventListener('input', handleChange);
          form.removeEventListener('change', handleChange);
          if (timeout) clearTimeout(timeout);
        };
      }

      // Expose API
      window.__SANDBOX_FORM__ = {
        // Validation
        validate: validateField,
        validateForm: validateForm,
        validators: validators,
        patterns: patterns,

        // Auto-save
        autoSave: autoSave,
        autoRestore: autoRestore,
        autoClear: autoClear,

        // Form data
        getData: getFormData,
        setData: setFormData,

        // Track form
        track: trackForm,

        // Add custom validator
        addValidator: function(name, fn) {
          validators[name] = fn;
        },

        // Add custom pattern
        addPattern: function(name, regex) {
          patterns[name] = regex;
        }
      };

      console.log('[Sandbox] Form helpers initialized');
    })();
  `;
}
