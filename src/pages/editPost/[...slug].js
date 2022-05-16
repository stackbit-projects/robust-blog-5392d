import React, { useEffect } from 'react';
import _ from 'lodash';
import moment from 'moment-strftime';
import { useRouter } from 'next/router';
import { Layout } from '../../components/index';
import Header from '../../components/Header';
import HeaderAlt from '../../components/HeaderAlt';
import Footer from '../../components/Footer';
import { htmlToReact, markdownify, withPrefix } from '../../utils';
import { getStrapiMedia } from '../../utils/strapiMedia';
import { UPDATE_POST } from '../../utils/graphql/mutation/post';
import { GET_POSTS } from '../../utils/graphql/queries/getPosts';
import { GET_POST } from '../../utils/graphql/queries/getPost';
import { useForm, usePlugin, useCMS, withTina, TinaProvider, TinaCMS } from 'tinacms'
import { client } from '../../utils/apollo/apollo';

import Link from 'next/link'
import { Link as ChakraLink } from "@chakra-ui/react";

import { Cache, useMutation,useQuery } from '@apollo/client';
import ReactGA from "react-ga4";


const EditPost = (props) => {
        const cms = useCMS();
        const router = useRouter()

        const post_detail = _.get(props, 'post_detail');
        console.log(post_detail)
        const eventTrack = (category, action, label) => {
            ReactGA.event({
              category: category,
              action: action,
              label: label,
            })
        }


        const [updatePost, { loading,data,error }] = useMutation(UPDATE_POST,
            {
                update: (cache, { data: { updatePost } }) => {
                    const cachedData  = cache.readQuery({ query: GET_POSTS});
                    
                    const postedData = updatePost
                    
                    console.log("INSIDE UDPATE FTTTNN posted data",postedData )
                    if(cachedData){
                        console.log("inside cached logic",cachedData)
                        const objPost = {
                            id:postedData.post.id,
                            title: postedData.post.title,
                            subtitle:postedData.post.subtitle,
                            date: postedData.post.date,
                            postDetail:postedData.post.postDetail,
                            published_at:postedData.post.published_at,
                            slug:postedData.post.slug,
                        }
                        
                        const isFound = cachedData.posts.filter((item) => item.id === objPost.id)
                        console.log("found",isFound.length)
                        if(!isFound.length){
                            console.log("not Found")
                            const posts = {posts:objPost}
                            console.log("after updasssted",posts)
                            cache.writeQuery({ query: GET_POSTS,data:posts });
                        }
                        
                    }else{
                        const objPost = {
                            id:postedData.post.id,
                            title: postedData.post.title,
                            subtitle:postedData.post.subtitle,
                            date: postedData.post.date,
                            postDetail:postedData.post.postDetail,
                            published_at:postedData.post.published_at,
                            slug:postedData.post.slug,
                        }
                        const posts = {posts:objPost}
                        cache.writeQuery({ query: GET_POSTS,data:posts});
                    }
                    
        },
            })

            useEffect(()=>{
                if(loading){
                    eventTrack("post","update_post_requested","Updating Post")
                }
            },[loading])  
        
            useEffect(()=>{
                
                if(data){
                    cms.alerts.success('Post Updated Successfully');
        
                    eventTrack("post","update_post","Post Updated")
        
                    router.push('/');
                }else if(error){
                    cms.alerts.error('Error while updating post');
                }
            },[data,error])


            const [pagee, form] = useForm(
                {
                  initialValues: "updatePost",
                  label: "Update Post",
                  fields: [
                    {
                        label: 'Hero Image',
                        name: 'frontmatter.hero_image',
                        component: 'image',
                        // Generate the frontmatter value based on the filename
                        parse: media => `/static/${media.filename}`,
              
                        // Decide the file upload directory for the post
                        uploadDir: () => '/public/static/',
              
                        // Generate the src attribute for the preview image.
                        previewSrc: fullSrc => fullSrc.replace('/public', ''),
                        defaultValue: post_detail.post.post_img_url
                      },
                      {
                        name: "postData.title",
                        label: "Post Title",
                        component: "text",
                        defaultValue: post_detail.post.title
                      },
                      {
                        name: "postData.subtitle",
                        label: "Post Subtitle",
                        component: "text",
                        defaultValue: post_detail.post.subtitle
                      },
                    //   {
                    //     name: "postData.category",
                    //     label: "Category",
                    //     component: "select",
                    //     defaultValue: "",
                    //     options: [
                    //       { value: "notSpecified", label: "N/A" },
                    //       ...category
                    //     ],
                    //   },
                      {
                        name: "postData.slug",
                        label: "Post Slug",
                        component: "text",
                        defaultValue: post_detail.post.slug
                      },
                      {
                        name: "postData.description",
                        label: "Post Description",
                        component: "markdown",
                        defaultValue: post_detail.post.postDetail[0].description
                      },
                    //   {
                        
                    //     name: 'postData.blocks',
                    //     component: 'blocks',
                    //     description: 'Content of blocks',
                    //     label: 'Add New Blocks',
                    //     templates: {
                    //         'body-content-block': {
                    //             label: 'Body Content',
                    //             key: 'bodyContent',
                    //             defaultItem: {
                    //                 content: post_detail.post.postDetail[0].description
                    //             },
                    //             fields: [{ name: 'content', label: 'Body Content', component: 'markdown' }]
                    //         },
                    //     }
                    // },
                ],
                onSubmit: async (values) => {
                    const dataa = {
                        ...values
                      }
                      const date = new Date();
                      dataa.date = date.toISOString().split('T')[0];
                    //    const ComponentBasicDescription = dataa.postData.blocks.map((item) => {
                    //     if(item._template === 'body-content-block'){
                    //       return item.content;
                    //     }
                    //   })
              
                    //   const ComponentBasicImage = dataa.postData.blocks.map((item) => {
                    //     if(item._template === 'body-image-block'){
                    //       return item;
                    //     }
                    //   })
                    const variables = {
                    input: {
                        where: {
                            id: post_detail.post.id,
                        },
                        data:{
                          
                          date:dataa.date,
                          title:dataa.postData.title,
                          subtitle:dataa.postData.subtitle,
                        //   category: dataa.postData.category,
                          slug: dataa.postData.slug,
                          postDetail: [{__typename: "ComponentBasicDescription", description: dataa.postData.description}]
                        } 
                      },
                    };
                    
                    updatePost({ variables})
                }
              }
            )
            usePlugin(form)


            const post = pagee
            const date = new Date();
            const dateTimeAttr = moment(date).strftime('%Y-%m-%d %H:%M');
            const formattedDate = moment(date).strftime('%B %d, %Y');
            const dataa = _.get(props, 'data');
            const config = _.get(dataa, 'config');
            const page = _.get(props, 'page');
        
        
        return (
            <Layout page={page} config={config}>
                <Header config={config} page='newPost' image={props.headerImg} />
                <div id="content" className="site-content">
                    <main id="main" className="site-main inner">
                        <article className="post post-full">
                            <header className="post-header">
                               {post.postData && <h1 className="post-title">{post.postData.title}</h1>} 
                                {/* <div style={{ backgroundColor: category ? category.category_color : '' }} className="cagtegory_tag">
                                    {category && category.category_name}
                                </div> */}
                                {post.postData &&
                                    <div className="post-meta">
                                        Published on <time className="published" dateTime={dateTimeAttr}>{formattedDate}</time>
                                    </div>}
                            </header>
                            {post.postData && <div className="post-subtitle">{post.postData.subtitle}</div>}
                            <img className="thumbnail" src='' alt='' />
                            {post.postData &&  post.postData.description && (
                                <div style={{ marginTop: '2rem' }} className="post-content">
                                    {markdownify(post.postData.description)}
                                </div>
                            )
                            
                                // post.postData.blocks.map((item,index) => {
                                //     switch (item._template) {
                                //         case 'body-content-block':
                                //             return (
                                //                 <div key={index} style={{ marginTop: '2rem' }} className="post-content">
                                //                     {markdownify(item.content)}
                                //                 </div>
                                //             );
                                //         case 'image-block':
                                //             return (
                                                
                                //                 <img
                                //                     key={index}
                                //                     style={{ marginTop: '2rem' }}
                                //                     className="thumbnail"
                                //                     src={withPrefix(getStrapiMedia(item.image))}
                                //             />
                                //             );

                                //         // case 'ComponentBasicVideo':
                                //         //     return (
                                //         //         <video style={{ width: '100%', height: '400px' }} controls>
                                //         //             <source src={getStrapiMedia(video)}></source>
                                //         //         </video>
                                //         //     );
                                //         // case 'ComponentBasicVideoWithUrl':
                                //         //     return <iframe style={{ width: '100%', height: '400px' }} src={url}></iframe>;
                                //         default:
                                //     }
                                // })
                                }
                        </article>
                    </main>
                    <Footer config={config} />
                </div>
            </Layout>
        );
    }

    export const getServerSideProps = async ({ params }) => {
        const { slug } = params
        const post = await client.query({
            query: GET_POST,
            variables:{
                id: slug[0],
            }
          });


    const props = {
        post_detail: post.data,
        slug: 'editPost'
    };
        return { props };
    };

export default EditPost;