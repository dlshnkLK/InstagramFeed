/*
 InstagramFeed

 @version 1.0.0

 @author Javier Sanahuja Liebana <bannss1@gmail.com>
 @contributor csanahuja <csanahuja@gmail.com>

 https://github.com/jsanahuja/jquery.instagramFeed

*/
var InstagramFeed = (function(){
    var defaults = {
        'host': "https://www.instagram.com/",
        'username': '',
        'tag': '',
        'container': '',
        'display_profile': true,
        'display_biography': true,
        'display_gallery': true,
        'display_igtv': false,
        'get_data': false,
        'callback': null,
        'styling': true,
        'items': 8,
        'items_per_row': 4,
        'margin': 0.5,
        'image_size': 640
    };

    var image_sizes = {
        "150": 0,
        "240": 1,
        "320": 2,
        "480": 3,
        "640": 4
    };

    return function(opts){
        this.options = Object.assign({}, defaults);
        this.options = Object.assign(this.options, opts);
        this.is_tag = this.options.username == "";

        this.valid = true;
        if(this.options.username == "" && this.options.tag == ""){
            console.error("InstagramFeed: Error, no username or tag defined.");
            this.valid = false;
        }else if(!this.options.get_data && this.options.container == ""){
            console.error("InstagramFeed: Error, no container found.");
            this.valid = false;
        }else if(this.options.get_data && typeof this.options.callback != "function"){
            console.error("InstagramFeed: Error, invalid or undefined callback for get_data");
            this.valid = false;
        }

        this.get = function(callback){
            var url = this.is_tag ? this.options.host + "explore/tags/" + this.options.tag : this.options.host + this.options.username,
                xhr = new XMLHttpRequest();

            var _this = this;
            xhr.onload = function(e){
                if(xhr.readyState === 4){
                    if (xhr.status === 200) {
                        var data = xhr.responseText.split("window._sharedData = ")[1].split("<\/script>")[0];
                        data = JSON.parse(data.substr(0, data.length - 1));
                        data = data.entry_data.ProfilePage || data.entry_data.TagPage || null;
                        if(data === null){
                            console.log(url);
                            console.error("InstagramFeed: Request error. No data retrieved: " + xhr.statusText);
                        }else{
                            data = data[0].graphql.user || data[0].graphql.hashtag;
                            callback(data, _this);
                        }
                    } else {
                        console.error("InstagramFeed: Request error. Response: " + xhr.statusText);
                    }
                }
            };
            xhr.open("GET", url, true);
            xhr.send();
        };

        this.display = function(data){
            // Styling
            if(this.options.styling){
                var width = (100 - this.options.margin * 2 * this.options.items_per_row)/this.options.items_per_row;
                var styles = {
                    'profile_container': " style='text-align:center;'",
                    'profile_image': " style='border-radius:10em;width:15%;max-width:125px;min-width:50px;'",
                    'profile_name': " style='font-size:1.2em;'",
                    'profile_biography': " style='font-size:1em;'",
                    'gallery_image': " style='margin:"+this.options.margin+"% "+this.options.margin+"%;width:"+width+"%;float:left;'"
                };
            }else{
                var styles = {
                    'profile_container': "",
                    'profile_image': "",
                    'profile_name': "",
                    'profile_biography': "",
                    'gallery_image': ""
                };
            }

            // Profile
            var html = "";
            if(this.options.display_profile){
                html += "<div class='instagram_profile'" +styles.profile_container +">";
                html += "<img class='instagram_profile_image' src='"+ data.profile_pic_url +"' alt='"+ data.name +" profile pic'"+ styles.profile_image +" />";
                if(this.is_tag)
                    html += "<p class='instagram_tag'"+ styles.profile_name +"><a href='https://www.instagram.com/explore/tags/"+ this.options.tag +"' rel='noopener' target='_blank'>#"+ this.options.tag +"</a></p>";
                else
                    html += "<p class='instagram_username'"+ styles.profile_name +">@"+ data.full_name +" (<a href='https://www.instagram.com/"+ this.options.username +"' rel='noopener' target='_blank'>@"+ this.options.username+"</a>)</p>";
        
                if(!this.is_tag && this.options.display_biography)
                    html += "<p class='instagram_biography'"+ styles.profile_biography +">"+ data.biography +"</p>";
    
                html += "</div>";
            }

            // Gallery
            if(this.options.display_gallery){
                var image_index = typeof image_sizes[this.options.image_size] !== "undefined" ? image_sizes[this.options.image_size] : image_sizes[640];

                if(typeof data.is_private !== "undefined" && data.is_private === true){
                    html += "<p class='instagram_private'><strong>This profile is private</strong></p>";
                }else{
                    var imgs = (data.edge_owner_to_timeline_media || data.edge_hashtag_to_media).edges;
                        max = (imgs.length > this.options.items) ? this.options.items : imgs.length;
                    
                    html += "<div class='instagram_gallery'>";

                    for(var i = 0; i < max; i++){
                        var url = "https://www.instagram.com/p/" + imgs[i].node.shortcode,
                            image, type_resource;

                        switch(imgs[i].node.__typename){
                            case "GraphSidecar":
                                type_resource = "sidecar"
                                image = imgs[i].node.thumbnail_resources[image_index].src;
                                break;
                            case "GraphVideo":
                                type_resource = "video";
                                image = imgs[i].node.thumbnail_src
                                break;
                            default:
                                type_resource = "image";
                                image = imgs[i].node.thumbnail_resources[image_index].src;
                        }

                        html += "<a href='" + url +"' class='instagram-" + type_resource + "' rel='noopener' target='_blank'>";
                        html += "<img src='" + image + "' alt='" + data.name + " instagram image "+ i + "'" + styles.gallery_image +" />";
                        html += "</a>";
                    }

                    html +=         "</div>";
                }
            }
            
            // IGTV
            if(this.options.display_igtv && typeof data.edge_felix_video_timeline !== "undefined"){
                var igtv = data.edge_felix_video_timeline.edges,
                    max = (igtv.length > this.options.items) ? this.options.items : igtv.length
                if(igtv.length > 0){
                    html += "<div class='instagram_igtv'>";
                    for(var i = 0; i < max; i++){
                        html += "<a href='https://www.instagram.com/p/"+ igtv[i].node.shortcode +"' rel='noopener' target='_blank'>";
                        html += "<img src='"+ igtv[i].node.thumbnail_src +"' alt='"+ this.options.username +" instagram image "+ i+"'"+styles.gallery_image+" />";
                        html += "</a>";
                    }
                    html += "</div>";
                }
            }

            this.options.container.innerHTML = html;
        };

        this.run = function(){
            this.get(function(data, instance){
                if(instance.options.get_data)
                    instance.options.callback(data);
                else
                    instance.display(data);
            });
        };

        if(this.valid){
            this.run();
        }
    };
})();