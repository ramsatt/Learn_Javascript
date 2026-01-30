const fs = require('fs');
const path = require('path');

const baseSrcDir = 'D:\\A21\\web scrapper\\w3schools\\www.w3schools.com';
const destDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\content';
const dataDir = 'd:\\a20\\javascript\\js-learning-app\\src\\assets\\data';

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const courseConfigs = {
    'sql': {
        title: "SQL",
        id: "sql",
        sections: [
            {
                title: "SQL Tutorial",
                files: ["default.html", "sql_intro.html", "sql_syntax.html", "sql_select.html", "sql_distinct.html", "sql_where.html", "sql_and.html", "sql_or.html", "sql_not.html", "sql_orderby.html", "sql_insert.html", "sql_null_values.html", "sql_update.html", "sql_delete.html", "sql_top.html", "sql_min_max.html", "sql_count_avg_sum.html", "sql_like.html", "sql_wildcards.html", "sql_in.html", "sql_between.html", "sql_alias.html", "sql_join.html", "sql_join_inner.html", "sql_join_left.html", "sql_join_right.html", "sql_join_full.html", "sql_join_self.html", "sql_union.html", "sql_groupby.html", "sql_having.html", "sql_exists.html", "sql_any_all.html", "sql_insert_into_select.html", "sql_case.html", "sql_isnull.html", "sql_stored_procedures.html", "sql_comments.html", "sql_operators.html"]
            },
            {
                title: "SQL Database",
                files: ["sql_create_db.html", "sql_drop_db.html", "sql_backup_db.html", "sql_create_table.html", "sql_drop_table.html", "sql_alter.html", "sql_constraints.html", "sql_notnull.html", "sql_unique.html", "sql_primarykey.html", "sql_foreignkey.html", "sql_check.html", "sql_default.html", "sql_create_index.html", "sql_autoincrement.html", "sql_dates.html", "sql_view.html", "sql_injection.html", "sql_hosting.html"]
            },
            {
                title: "SQL References",
                files: ["sql_ref_keywords.html", "sql_quickref.html"]
            }
        ]
    },
    'c': {
        title: "C",
        id: "c",
        sections: [
            {
                title: "C Tutorial",
                files: ["default.html", "c_intro.html", "c_getstarted.html", "c_syntax.html", "c_output.html", "c_newline.html", "c_comments.html", "c_variables.html", "c_data_types.html", "c_constants.html", "c_operators.html", "c_booleans.html", "c_conditions.html", "c_switch.html", "c_while_loop.html", "c_for_loop.html", "c_break_continue.html", "c_arrays.html", "c_strings.html", "c_user_input.html", "c_memory_address.html", "c_pointers.html"]
            },
            {
                title: "C Functions",
                files: ["c_functions.html", "c_functions_parameters.html", "c_functions_decl.html", "c_functions_recursion.html", "c_math.html"]
            },
            {
                title: "C Structures & Files",
                files: ["c_structs.html", "c_enums.html", "c_files.html", "c_files_write.html", "c_files_read.html"]
            },
            {
                title: "C References",
                files: ["c_ref_keywords.html", "c_ref_stdio.html", "c_ref_stdlib.html", "c_ref_string.html", "c_ref_math.html", "c_ref_ctype.html", "c_ref_time.html"]
            }
        ]
    },
    'react': {
        title: "React",
        id: "react",
        sections: [
            {
                title: "React Tutorial",
                files: ["default.html", "react_intro.html", "react_getstarted.html", "react_es6.html", "react_render.html", "react_jsx.html", "react_components.html", "react_class.html", "react_props.html", "react_events.html", "react_conditional_rendering.html", "react_lists.html", "react_forms.html", "react_router.html", "react_memo.html", "react_css_styling.html", "react_sass_styling.html"]
            },
            {
                title: "React Hooks",
                files: ["react_hooks.html", "react_usestate.html", "react_useeffect.html", "react_usecontext.html", "react_useref.html", "react_usereducer.html", "react_usecallback.html", "react_usememo.html", "react_customhooks.html"]
            }
        ]
    },
    'nodejs': {
        title: "Node.js",
        id: "nodejs",
        sections: [
            {
                title: "Node.js Tutorial",
                files: ["default.html", "nodejs_intro.html", "nodejs_get_started.html", "nodejs_modules.html", "nodejs_http.html", "nodejs_filesystem.html", "nodejs_url.html", "nodejs_npm.html", "nodejs_events.html", "nodejs_uploadfiles.html", "nodejs_email.html"]
            },
            {
                title: "Node.js MySQL",
                files: ["nodejs_mysql.html", "nodejs_mysql_create_db.html", "nodejs_mysql_create_table.html", "nodejs_mysql_insert.html", "nodejs_mysql_select.html"]
            },
            {
                title: "Node.js MongoDB",
                files: ["nodejs_mongodb.html", "nodejs_mongodb_create_db.html", "nodejs_mongodb_create_collection.html", "nodejs_mongodb_insert.html", "nodejs_mongodb_find.html"]
            }
        ]
    },
    'bootstrap5': {
        title: "Bootstrap 5",
        id: "bootstrap5",
        sections: [
            {
                title: "BS5 Basic",
                files: ["default.html", "bootstrap_get_started.html", "bootstrap_containers.html", "bootstrap_grid_basic.html", "bootstrap_typography.html", "bootstrap_colors.html", "bootstrap_tables.html", "bootstrap_images.html", "bootstrap_jumbotron.html", "bootstrap_alerts.html", "bootstrap_buttons.html"]
            },
            {
                title: "BS5 Components",
                files: ["bootstrap_button_groups.html", "bootstrap_badges.html", "bootstrap_progressbars.html", "bootstrap_spinners.html", "bootstrap_pagination.html", "bootstrap_list_groups.html", "bootstrap_cards.html", "bootstrap_dropdowns.html", "bootstrap_collapse.html", "bootstrap_navs.html", "bootstrap_navbar.html", "bootstrap_carousel.html", "bootstrap_modal.html", "bootstrap_tooltip.html", "bootstrap_popover.html", "bootstrap_toast.html", "bootstrap_scrollspy.html", "bootstrap_offcanvas.html"]
            },
            {
                title: "BS5 Forms",
                files: ["bootstrap_forms.html", "bootstrap_form_inputs.html", "bootstrap_form_select.html", "bootstrap_form_check_radio.html", "bootstrap_form_range.html", "bootstrap_form_input_group.html", "bootstrap_form_floating_labels.html", "bootstrap_form_validation.html"]
            }
        ]
    },
    'jquery': {
        title: "jQuery",
        id: "jquery",
        sections: [
            {
                title: "jQuery Tutorial",
                files: ["default.html", "jquery_intro.html", "jquery_get_started.html", "jquery_syntax.html", "jquery_selectors.html", "jquery_events.html"]
            },
            {
                title: "jQuery Effects",
                files: ["jquery_hide_show.html", "jquery_fade.html", "jquery_slide.html", "jquery_animate.html", "jquery_stop.html", "jquery_callback.html", "jquery_chaining.html"]
            },
            {
                title: "jQuery HTML",
                files: ["jquery_dom_get.html", "jquery_dom_set.html", "jquery_dom_add.html", "jquery_dom_remove.html", "jquery_css_classes.html", "jquery_css.html", "jquery_dimensions.html"]
            },
            {
                title: "jQuery Traversing",
                files: ["jquery_traversing.html", "jquery_traversing_ancestors.html", "jquery_traversing_descendants.html", "jquery_traversing_siblings.html", "jquery_traversing_filtering.html"]
            },
            {
                title: "jQuery AJAX",
                files: ["jquery_ajax_intro.html", "jquery_ajax_load.html", "jquery_ajax_get_post.html", "jquery_noconflict.html"]
            }
        ]
    },
    'git': {
        title: "Git",
        id: "git",
        sections: [
            {
                title: "Git Tutorial",
                files: ["default.html", "git_intro.html", "git_get_started.html", "git_github.html", "git_new_repo.html", "git_remote_add.html", "git_push.html", "git_pull.html", "git_staged.html", "git_commit.html", "git_branch.html", "git_merge.html", "git_ignore.html", "git_revert.html", "git_reset.html"]
            }
        ]
    },
    'php': {
        title: "PHP",
        id: "php",
        sections: [
            {
                title: "PHP Tutorial",
                files: ["default.html", "php_intro.html", "php_install.html", "php_syntax.html", "php_comments.html", "php_variables.html", "php_echo_print.html", "php_datatypes.html", "php_strings.html", "php_numbers.html", "php_math.html", "php_constants.html", "php_operators.html", "php_if_else.html", "php_switch.html", "php_looping.html", "php_functions.html", "php_arrays.html", "php_superglobals.html", "php_regex.html"]
            }
        ]
    },
    'typescript': {
        title: "TypeScript",
        id: "typescript",
        sections: [
            {
                title: "TS Tutorial",
                files: ["default.html", "typescript_intro.html", "typescript_getstarted.html", "typescript_simple_types.html", "typescript_special_types.html", "typescript_arrays.html", "typescript_tuples.html", "typescript_object_types.html", "typescript_enums.html", "typescript_aliases_and_interfaces.html", "typescript_union_types.html", "typescript_functions.html", "typescript_casting.html", "typescript_classes.html", "typescript_basic_generics.html", "typescript_utility_types.html", "typescript_keyof.html"]
            }
        ]
    },
    'angular': {
        title: "Angular",
        id: "angular",
        sections: [
            {
                title: "Angular Tutorial",
                files: ["default.html", "angular_intro.html", "angular_getstarted.html", "angular_components.html", "angular_templates.html", "angular_directives.html", "angular_pipes.html", "angular_routing.html", "angular_services.html", "angular_http_client.html", "angular_forms.html"]
            }
        ]
    },
    'go': {
        title: "Go",
        id: "go",
        sections: [
            {
                title: "Go Tutorial",
                files: ["default.html", "go_intro.html", "go_getstarted.html", "go_syntax.html", "go_comments.html", "go_variables.html", "go_data_types.html", "go_output.html", "go_arrays.html", "go_slices.html", "go_operators.html", "go_conditions.html", "go_switch.html", "go_loops.html", "go_functions.html", "go_struct.html", "go_maps.html"]
            }
        ]
    }
};

const removeElement = (html, tagName, attrName, attrValue) => {
    const regex = new RegExp(`<${tagName}[^>]*${attrName}=['"]${attrValue}['"][\\s\\S]*`, 'i');
    const match = html.match(regex);
    if (match) {
        let s = match.index;
        let depth = 0;
        let pos = s;
        while (pos < html.length) {
            if (html.substring(pos, pos + tagName.length + 1).toLowerCase() === `<${tagName}`) {
                depth++;
                pos += tagName.length + 1;
            } else if (html.substring(pos, pos + tagName.length + 3).toLowerCase() === `</${tagName}>`) {
                depth--;
                pos += tagName.length + 3;
                if (depth === 0) {
                    return html.substring(0, s) + html.substring(pos);
                }
            } else {
                pos++;
            }
        }
    }
    return html;
};

Object.keys(courseConfigs).forEach(key => {
    const config = courseConfigs[key];
    const srcDir = path.join(baseSrcDir, key);
    const menuData = [];

    config.sections.forEach(section => {
        const sectionItems = [];
        section.files.forEach(file => {
            const fullPath = path.join(srcDir, file);
            const prefix = (file === 'default.html') ? `${config.id}_` : ''; 
            const destFile = `${config.id}_${file}`;
            
            if (fs.existsSync(fullPath)) {
                console.log(`Processing ${config.title}: ${file}...`);
                let content = fs.readFileSync(fullPath, 'utf8');

                let mainMatch = content.match(/<div[^>]*id=['"]main['"][^>]*>/i);
                let startIndex = mainMatch ? content.indexOf(mainMatch[0]) + mainMatch[0].length : 0;
                let extracted = content.substring(startIndex);

                const endMarkers = [
                    /<div[^>]*id=['"]user-profile-bottom-wrapper['"]/i,
                    /<footer/i,
                    /<div[^>]*id=['"]right['"]/i
                ];

                let earliestEnd = extracted.length;
                for (const marker of endMarkers) {
                    const match = extracted.match(marker);
                    if (match && match.index < earliestEnd) earliestEnd = match.index;
                }

                // Handle nextprev separately to avoid cutting off at the top bar
                const nextPrevMatches = [...extracted.matchAll(/<div[^>]*class=['"](w3-clear\s+)?nextprev['"]/gi)];
                if (nextPrevMatches.length > 0) {
                    // Look for the one that is likely at the bottom (index > 500)
                    let bottomNextPrev = nextPrevMatches.reverse().find(m => m.index > 500);
                    if (bottomNextPrev && bottomNextPrev.index < earliestEnd) {
                        earliestEnd = bottomNextPrev.index;
                    }
                }

                extracted = extracted.substring(0, earliestEnd);

                // Cleaning
                extracted = extracted.replace(/<div[^>]*id=['"]midcontentadcontainer['"][\s\S]*?<\/div>/gi, "");
                extracted = extracted.replace(/<div[^>]*id=['"]mainLeaderboard['"][\s\S]*?<\/div>/gi, "");
                extracted = extracted.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
                extracted = removeElement(extracted, 'div', 'class', 'ws-learnhtml');
                extracted = removeElement(extracted, 'div', 'class', 'ws-hide-on-logged-in');
                extracted = removeElement(extracted, 'div', 'id', 'getdiploma');
                extracted = removeElement(extracted, 'div', 'class', 'containerlog');
                extracted = extracted.replace(/<div[^>]*class=['"](w3-clear\s+)?nextprev['"][\s\S]*?<\/div>/gi, "");
                extracted = extracted.replace(/<a[^>]*>Try it Yourself[\s\S]*?<\/a>/gi, "");
                extracted = extracted.replace(/<a[^>]*class=['"]w3-btn[^>]*>[\s\S]*?Try it Yourself[\s\S]*?<\/a>/gi, "");
                extracted = extracted.replace(/<div[^>]*id=['"]exercisecontainer['"][\s\S]*?<\/div>/gi, "");
                extracted = extracted.replace(/<div[^>]*style=['"][^'"]*background-color:\s*#282b35[^'"]*['"][\s\S]*/gi, "");
                extracted = extracted.replace(/<!--[\s\S]*?-->/g, "");

                // Images
                extracted = extracted.replace(/src="([^"]*)"/g, (match, p1) => {
                    if (!p1.startsWith('http') && !p1.startsWith('data:')) {
                        const imgName = path.basename(p1);
                        const possiblePaths = [path.join(srcDir, p1), path.join(srcDir, 'images', imgName), path.join(srcDir, imgName)];
                        for (const imgPath of possiblePaths) {
                            if (fs.existsSync(imgPath) && !fs.lstatSync(imgPath).isDirectory()) {
                                const imgDir = path.join(destDir, 'images');
                                if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
                                fs.copyFileSync(imgPath, path.join(imgDir, imgName));
                                return `src="assets/content/images/${imgName}"`;
                            }
                        }
                    }
                    return match;
                });

                fs.writeFileSync(path.join(destDir, destFile), extracted.trim());

                let title = file.replace(`${config.id}_`, '').replace('.html', '').replace(/_|-/g, ' ');
                title = title.charAt(0).toUpperCase() + title.slice(1);
                const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
                if (titleMatch) {
                    title = titleMatch[1].replace(/<span[^>]*>|<\/span>/g, '').trim();
                }
                
                sectionItems.push({ title, file: destFile });
            } else {
                console.warn(`File not found: ${fullPath}`);
            }
        });
        if (sectionItems.length > 0) {
            menuData.push({ title: section.title, items: sectionItems });
        }
    });

    fs.writeFileSync(path.join(dataDir, `${config.id}.json`), JSON.stringify(menuData, null, 2));
});

console.log('Premium one-by-one scraping completed.');
