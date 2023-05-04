import {makeExecutableSchema} from "@graphql-tools/schema";
import { GraphQLError } from "graphql";
const fs = require("fs");
const path = require("path");
export const schema =  makeExecutableSchema({
    typeDefs:fs.readFileSync(
        path.join(__dirname, "/schema/schema.graphql"),
        "utf-8"
    ),
    resolvers: {
        Query: {
            cvs: (parent,args,{db})=> db.cv,
            cvById:(parent,{id},{db})=> {
                const foundCV = db.cv.find((cv:any)=>cv.id===id);
                if(!foundCV) throw new GraphQLError("CV Not Found !",
                {
                    extensions: {
                        http: {
                            status: 404,
                            headers: {
                            "x-custom-header": "some-value",
                            },
                        },
                    }
                });
                return foundCV;
            }
        },
        cv:{
            skills: (parent,args,{db})=> {
                const skills=[]
                for (const element of db.cv_skill) {
                    if(parent.id === element.idCv){
                        skills.push(db.skill.find((skill: any)=>skill.id === element.idSkill))
                    }
                }
                return skills
            },
            user:(parent,args,{db})=> {
                const cV = db.cv.find((cv: any) => cv.id === parent.id)
                const user = db.user.find((user: any) => user.id === cV.idUser)
                if (!user) {
                    throw new GraphQLError(`User with ID ${cV.idUser} not found`,
                    {
                        extensions: {
                            http: {
                                status: 404,
                                headers: {
                                "x-custom-header": "some-value",
                                },
                            },
                        }
                    });
                }
                return user;    
            }
        },
        Mutation:{
            addCv:(parent,{input},{db,pubSub})=> {
                const cv={...input}
                const userFound = db.user.find((user:any)=>user.id===input.idUser)
                if (userFound === undefined) {
                    throw new GraphQLError(`User with ID ${input.idUser} not found`,
                    {
                        extensions: {
                            http: {
                                status: 404,
                                headers: {
                                "x-custom-header": "some-value",
                                },
                            },
                        }
                    });
                }
                cv.id=db.cv[db.cv.length-1].id+1
                db.cv.push(cv)
                pubSub.publish("cvSub", {msg : "CV Added Successfully !", cv : cv})
                return db.cv
            },
            updateCv:(parent, {input},{db,pubSub})=> {
                const cvFound =db.cv.find((cv:any)=>cv.id===input.id)
                if (cvFound === undefined) {
                    throw new GraphQLError(`CV with ID ${input.id} not found`,
                    {
                        extensions: {
                            http: {
                                status: 404,
                                headers: {
                                "x-custom-header": "some-value",
                                },
                            },
                        }
                    });
                }
                const index = db.cv.indexOf(cvFound);
                db.cv[index]={...input}
                const res  = db.cv[index]
                pubSub.publish("cvSub", {msg : "CV Updated Successfully !", cv : res})
                return db.cv[index]
            },
            deleteCv:(parent, {id},{db,pubSub})=> {
                const cvFound = db.cv.find((cv:any)=>cv.id===id)
                if (cvFound === undefined) {
                    throw new GraphQLError(`CV with ID ${id} not found`,
                    {
                        extensions: {
                            http: {
                                status: 404,
                                headers: {
                                "x-custom-header": "some-value",
                                },
                            },
                        }
                    });
                }
                const index = db.cv.indexOf(cvFound)
                db.cv.splice(index, 1);
                pubSub.publish("cvSub", {msg : "CV Deleted Successfully !", cv : cvFound})
                return db.cv
            },
        },
        Subscription:{
            cvSubscription:{
                subscribe: (parent, args, { db, pubSub }) => pubSub.subscribe("cvSub"),
                resolve: (payload) => { return payload;}
            }
        }
    },
});