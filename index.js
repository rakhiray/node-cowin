const express = require('express');
// const fetch = require('node-fetch');
const axios = require('axios');
const app = express();
// app.use(express.json());
 app.use(express.static('public'));

const { Sequelize, DataTypes } = require('sequelize');
const { response } = require('express');

const sequelize = new Sequelize("test", "root", "", {
    host: "localhost",
    dialect: "mariadb",
    port: "3307",
  });

  const State = sequelize.define('state', {
    state_id: DataTypes.INTEGER,
    title: DataTypes.TEXT,
    state_name: DataTypes.TEXT,
    total: DataTypes.INTEGER,
    partial_vaccinated: DataTypes.INTEGER,
    totally_vaccinated: DataTypes.INTEGER,
    today: DataTypes.INTEGER,
    
  },{freezeTableName:true});

  const Sites = sequelize.define('sites', {
    govt: DataTypes.INTEGER,
    pvt: DataTypes.INTEGER,
    today: DataTypes.TEXT,
    total: DataTypes.INTEGER
  },{freezeTableName:true});

  State.hasOne(Sites);
  Sites.belongsTo(State);

  const Registration = sequelize.define('registration', {
    cit_18_45: DataTypes.INTEGER,
    cit_45_above: DataTypes.INTEGER,
    today: DataTypes.TEXT,
    total: DataTypes.INTEGER,
    yesterday:DataTypes.INTEGER
  },{freezeTableName:true});



let url = 'https://api.cowin.gov.in/api/v1/reports/v2/getPublicReports?state_id=&district_id=&date=2021-09-07';

const getData = async () => {

  const response = await axios.get(url);
  const result = response.data.getBeneficiariesGroupBy;

  await sequelize.sync({ force: true });

  const stateData = await State.bulkCreate(result);
   
  const stateIds = await State.findAll({attributes: ['state_id']});

    stateIds.forEach(element =>  {
       console.log(stateData.dataValues.state_id);
        getSitedata(element);      
   });   
}
getData();

const getSitedata = async (stateData) => {
    const url = 'https://api.cowin.gov.in/api/v1/reports/v2/getPublicReports?state_id='+stateData.dataValues.state_id +'&district_id=&date=2021-09-08';
       
    const response = await axios.get(url);
    const result = response.data.topBlock.sites
    console.log(result);

    result.stateId = stateData.dataValues.state_id;
    console.log(result);
    const sitesData = await Sites.create(result);    
}

const getRegistrationData = async () => {

  await sequelize.sync({ force: true });
  const response = await axios.get(url);
  const result = response.data.topBlock.registration;
  
  const registrationData = await Registration.create(result);
  console.log(result);
} 

getRegistrationData();


app.get('/getVaccinationData', async (req, res) => {

    const data = {
        "total": '',
        "partial_vaccinated": '',
        "totally_vaccinated": ''
    }   
    // sumVaccine(res);
    data.total = await State.sum('total');
    data.partial_vaccinated = await State.sum('partial_vaccinated');
    data.totally_vaccinated = await State.sum('totally_vaccinated');
    res.send(data);
 });

 app.get('/getSitesData', async (req, res) => {

  const data = {
      "govt": '',
      "pvt": '',
      "total": ''
  }   
 
  data.govt = await Sites.sum('govt');
  data.pvt = await Sites.sum('pvt');
  data.total = await Sites.sum('total');
  res.send(data);
});

app.get('/getRegistrationData', async (req, res) => {

  const data = {
      "cit_18_45": '',
      "cit_45_above": '',
      "total": ''
  }   
 
  data.cit_18_45 = await Registration.sum('cit_18_45');
  data.cit_45_above = await Registration.sum('cit_45_above');
  data.total = await Registration.sum('total');
  res.send(data);
});

app.get('/getStates', async (req, res) => {

  const states = await State.findAll({attributes: ['state_id', 'state_name']});
  console.log(states);
  res.send(states);
})

app.get('/getVaccinationDataByStates/:id', async (req, res) => {

  const states = await State.findAll({ where: {
    state_id: req.params.id
  }});
  console.log(states);
  res.send(states);
})


 
//  const sumVaccine = async (res) => {
         
//  }


app.listen(8080, () => console.log('listening on port 8080...'));
