
class APIfeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      const queryObj = { ...this.queryString };
  
      const excludedFields = ["page", "sort", "limit", "fields"];
      excludedFields.forEach((el) => delete queryObj[el]);
      // http://localhost:3000/api/v1/tours?duration=5&difficulty=easy&price=1500
  
      // 1B advance filtering
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
      // http://localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy&price[lt]=1500
  
      this.query = this.query.find(JSON.parse(queryStr));
  
      return this;
    }
  
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(",").join(" "); // This .split(',').join(' ') seperates everything and joins them with space (eg: ['name duration']) coz look at the URL
        // console.log(sortBy);
        this.query = this.query.sort(sortBy);
      } else {
        // http://localhost:3000/api/v1/tours
        this.query = this.query.sort("-createdAt");
      }
      return this;
    }
  
    limitFields() {
      if (this.queryString.fields) {
        // http://localhost:3000/api/v1/tours?fields=name,duration
        const fields = this.queryString.fields.split(",").join(" "); // This .split(',').join(' ') seperates everything and joins them with space (eg: ['name duration'])
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select("-__v"); // if we add "-" it excludes that field & if we dont put it includes
      }
      return this;
    }
  
    paginate() {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit);
  
      return this;
    }
  }

  module.exports = APIfeatures;