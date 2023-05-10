from datetime import datetime
from flaskblog import db, login_manager
from flask_login import UserMixin


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    image_file = db.Column(db.String(20), nullable=False, default='default.jpg')
    password = db.Column(db.String(60), nullable=False)
    creation_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    plan = db.Column(db.String(10), nullable=True)
    city = db.Column(db.String(30), nullable=True)
    country = db.Column(db.String(30), nullable=True)
    country_code = db.Column(db.String(4), nullable=True)
    country_calling_code = db.Column(db.String(4), nullable=True)
    ip = db.Column(db.String(20), nullable=True)
    loc = db.Column(db.String(30), nullable=True)
    org = db.Column(db.String(50), nullable=True)
    postal = db.Column(db.String(8), nullable=True)
    region = db.Column(db.String(30), nullable=True)
    timezone = db.Column(db.String(40), nullable=True)
    # posts = db.relationship('Post', backref='author', lazy=True)

    def __repr__(self):
        return f"User('{self.username}', '{self.email}', '{self.image_file}')"


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"Post('{self.title}', '{self.date_posted}')"

class UserAlgorun(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20),  nullable=False)
    run_date = db.Column(db.Date,  nullable=False, default=datetime.utcnow)
    strategy_name = db.Column(db.String(20), nullable=False, default='SYSTEM')
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Integer, nullable=True)
    num_trx = db.Column(db.Integer, nullable=True)
    start_bal = db.Column(db.Float, nullable=True)
    end_bal = db.Column(db.Float, nullable=True)
    profit = db.Column(db.Float, nullable=False)
    pos_trades = db.Column(db.Integer, nullable=False)
    neg_trades = db.Column(db.Integer, nullable=False)
    tot_fee = db.Column(db.Float, nullable=True)
    transactions = db.Column(db.Text, nullable=True)
    summary = db.Column(db.Text, nullable=True)

