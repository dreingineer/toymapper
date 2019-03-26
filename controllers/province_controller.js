const db = require('../models/index');
const utils = require('../helpers/utils');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const sorter = require('../helpers/sorter');

// const path = require('path');
const Province = db.Province;
// const getModule = require('../helpers/getModule').getModule;


//import csv Working!
const importcsv = async (req, res) => {
    //------------------------------------------------------
    const file = req.file ? req.file.path : null;
    console.log('FILE', file);
    if(!file) return ReE(res, { message: 'CSV file not found'}, 400);

    const csv = require('../helpers/csv_validator/');

    const headers  = {
        code: '',
        name: '',
        regionId: ''
    };

    // const headers = Province.createtables;
    
    async function insert(json) {
        let err, province;
        [err, province] = await to(Province.bulkCreate(json));
        if(err) return ReE(res, err, 500);

        return ReS(res, {
            message: 'Successfully imported CSV file',
            data: province
        }, 200);
    }

    async function validateJSON(json) {
        insert(json);
    }

    function start() {
        csv(file, headers).then( result => {
            validateJSON(result);
        }).catch(err => {
            return ReE(res, {
                message: 'Failed to import csv file.',
                data: err
            }, 400);
        });
    }

    start();
}

// export csv working!
const exportcsv = async (req, res) => {
    let err, province;

    [err, province] = await to(Province.findAll());
    if(err) return ReE(res, err, 500);
    if(!province) return ReE(res, {message: 'No data to download.'}, 400);
 
    province = utils.clone(province);

    const json2csv = require('json2csv').Parser;
    const parser = new json2csv({encoding: 'utf-8', withBOM: true});
    const csv = parser.parse(province);

    res.setHeader('Content-disposition', 'attachment; filename=Province.csv');
    res.set('Content-Type','text/csv');
    // res.set('application/octet-stream', 'text/csv');
    res.send(csv);
}

// Pagination
const getProvinceList = (req, res, next) => {
    let limit = 10;
    let offset = 0;
    Province.findAndCountAll()
    .then(data => {
        let page = req.params.page;
        let pages = Math.ceil(data.count / limit);
            offset = limit * (page -1);
        Province.findAll({
            attributes: ['id','name','code','regionId'],
            limit: limit,
            offset: offset,
            $sort: { id: 1}
        })
        .then( provinces => {
            res.status(200).json({'result': provinces, 'count':data.count, 'pages': pages});
        });
    })
    .catch(err => {
        res.status(500).send('Internal server error');
    });
}

// get all province
const getAll = (req, res, next) => {
    Province.findAll({
        paranoid: false
    }).then(provinces => {
        res.send(provinces);
    }).catch(next);
}

// post a province
const post = (req, res, next) => {
    Province.create(req.body)
    .then( province => {
        res.send(province);
    }).catch(next);
}

// find province by id
const findById = (req, res, next) => {
    let id = req.params.id;
    Province.findById(id)
    .then(province => {
        if(!province) res.sendStatus(404);
        else {
            res.send(province);
        }
    })
    .catch(next);
}

// update a particular province
const updateById = (req,res,next) => {
    Province.update({...req.body}, {where: {id: req.params.id}})
    .then(() => {
        res.send('Updated a province successfully.');
    }).catch(next);
}

// delete a province by id
const deleteById = (req, res, next) => {
    const id = req.params.id;
    Province.destroy({
        where: {id: id}
    })
    .then(() => {
        res.send(`Deleted province ${id}!`);
    }).catch(next);
}

// search province
const search = async (req, res) => {
    // res.setHeader('Content-type', 'application/json');
    // const {
    //     id,
    //     name,
    //     code,
    //     createdAt,
    //     updatedAt,
    //     deletedAt,
    //     regionId
    // } = req.query;
    // [err, province] = await to(Province.findAll({
    //     where: {
    //         [Op.or]: [{'id':id},{'name':name},{'code':code},{'createdAt':createdAt},
    //         {'updatedAt':updatedAt},{'deletedAt':deletedAt},{'regionId':regionId}]
    //     }
    // }));

    // return ReS(res, {'Province': province});

    // search v2 own version
    const {
        id,
        name,
        code,
        regionId
    } = req.query;
    [err, provinces] = await to(Province.findAll({
        attributes: [
            [db.sequelize.fn('concat', db.sequelize.col('id'),',', db.sequelize.col('name'),',', db.sequelize.col('code'),',', db.sequelize.col('regionId')), 'Result(s): ']
        ],
        where: {
            [Op.or]: [
                {id: {[Op.like]: '%'+ id +'%'}},
                {name: {[Op.like]: '%'+ name +'%'}},
                {code: {[Op.like]: '%'+ code + '%'}},
                {regionId: {[Op.like]: '%'+ regionId +'%'}}
            ]
        },
        paranoid: false,
        limit: 10
    }));
    if(err) return ReE(res, err, 500);
    return ReS(res, {
        message: 'Searched: ',
        data: provinces
    },200);
};

// filter a province
const filter = async (req, res) => {
    let reqQuery = req.query;
    let reqQuery_Sort = req.query.sortBy;
    let condition = {};
    let sort = [];

    if(Object.keys(reqQuery).length > 0) {
        if(reqQuery_Sort) {
            sort = await sorter.convertToArrSort(reqQuery_Sort);
            delete reqQuery.sortBy;
        }
        condition = reqQuery;
    }

    Province.findAll({
        attributes: [
            [db.sequelize.fn('concat', db.sequelize.col('id'),',', db.sequelize.col('name'),',', db.sequelize.col('code'),',', db.sequelize.col('regionId')), 'Filter Result(s): ']
        ],
        where: condition,
        order: sort,
        paranoid: false
    })
    .then( provinces => {
        res.send(provinces);
    })
    .catch( err => {
        console.log(err);
    });
};

module.exports = {
    importcsv,
    exportcsv,
    getProvinceList,
    getAll,
    post,
    findById,
    updateById,
    deleteById,
    search,
    filter
}
