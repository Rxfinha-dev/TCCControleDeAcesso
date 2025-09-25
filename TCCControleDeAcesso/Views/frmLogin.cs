using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Controllers;
using TCCControleDeAcesso.Models;
using ZstdSharp.Unsafe;
using System.Windows.Forms;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.ComponentModel;

namespace TCCControleDeAcesso.Views
{
    public partial class frmLogin : Form
    {
        Login _login;
        CadastroEmpresas _empresas;

        // Variáveis de controle
        int baseY;
        double angle = 0;
        int amplitude = 5; // altura do "flutuar"
        double speed = 0.1;


        public class RJButton : Button
        {
            //Fields
            private int borderSize = 0;
            private int borderRadius = 20;
            private Color borderColor = Color.PaleVioletRed;

            //Properties
            [Category("RJ Code Advance")]
            public int BorderSize
            {
                get { return borderSize; }
                set
                {
                    borderSize = value;
                    this.Invalidate();
                }
            }

            [Category("RJ Code Advance")]
            public int BorderRadius
            {
                get { return borderRadius; }
                set
                {
                    borderRadius = value;
                    this.Invalidate();
                }
            }

            [Category("RJ Code Advance")]
            public Color BorderColor
            {
                get { return borderColor; }
                set
                {
                    borderColor = value;
                    this.Invalidate();
                }
            }
            [Category("RJ Code Advance")]
            public Color BackgroundColor
            {
                get { return this.BackColor; }
                set { this.BackColor = value; }
            }

            [Category("RJ Code Advance")]
            public Color TextColor
            {
                get { return this.ForeColor; }
                set { this.ForeColor = value; }
            }

            //Constructor
            public RJButton()
            {
                this.FlatStyle = FlatStyle.Flat;
                this.FlatAppearance.BorderSize = 0;
                this.Size = new Size(150, 40);
                this.BackColor = Color.MediumSlateBlue;
                this.ForeColor = Color.White;
                this.Resize += new EventHandler(Button_Resize);
            }

            private void Button_Resize(object sender, EventArgs e)
            {
                if (borderRadius > this.Height)
                    borderRadius = this.Height;
            }

            //Methods
            private GraphicsPath GetFigurePath(Rectangle rect, float radius)
            {
                GraphicsPath path = new GraphicsPath();
                float curveSize = radius * 2F;

                path.StartFigure();
                path.AddArc(rect.X, rect.Y, curveSize, curveSize, 180, 90);
                path.AddArc(rect.Right - curveSize, rect.Y, curveSize, curveSize, 270, 90);
                path.AddArc(rect.Right - curveSize, rect.Bottom - curveSize, curveSize, curveSize, 0, 90);
                path.AddArc(rect.X, rect.Bottom - curveSize, curveSize, curveSize, 90, 90);
                path.CloseFigure();
                return path;
            }

            protected override void OnPaint(PaintEventArgs pevent)
            {
                base.OnPaint(pevent);

                Rectangle rectSurface = this.ClientRectangle;
                Rectangle rectBorder = Rectangle.Inflate(rectSurface, -borderSize, -borderSize);
                int smoothSize = 2;
                if (borderSize > 0)
                    smoothSize = borderSize;

                if (borderRadius > 2) //Rounded button
                {
                    using (GraphicsPath pathSurface = GetFigurePath(rectSurface, borderRadius))
                    using (GraphicsPath pathBorder = GetFigurePath(rectBorder, borderRadius - borderSize))
                    using (Pen penSurface = new Pen(this.Parent.BackColor, smoothSize))
                    using (Pen penBorder = new Pen(borderColor, borderSize))
                    {
                        pevent.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
                        //Button surface
                        this.Region = new Region(pathSurface);
                        //Draw surface border for HD result
                        pevent.Graphics.DrawPath(penSurface, pathSurface);

                        //Button border                    
                        if (borderSize >= 1)
                            //Draw control border
                            pevent.Graphics.DrawPath(penBorder, pathBorder);
                    }
                }
                else //Normal button
                {
                    pevent.Graphics.SmoothingMode = SmoothingMode.None;
                    //Button surface
                    this.Region = new Region(rectSurface);
                    //Button border
                    if (borderSize >= 1)
                    {
                        using (Pen penBorder = new Pen(borderColor, borderSize))
                        {
                            penBorder.Alignment = PenAlignment.Inset;
                            pevent.Graphics.DrawRectangle(penBorder, 0, 0, this.Width - 1, this.Height - 1);
                        }
                    }
                }
            }

            protected override void OnHandleCreated(EventArgs e)
            {
                base.OnHandleCreated(e);
                this.Parent.BackColorChanged += new EventHandler(Container_BackColorChanged);
            }

            private void Container_BackColorChanged(object sender, EventArgs e)
            {
                this.Invalidate();
            }
        }

        public frmLogin()
        {
            InitializeComponent();
        }


        private void CleanAll()
        {
            txtLogin.Clear();
            txtSenha.Clear();
            txtLogin.Focus();
        }
        

        private void btnEntrar_Click(object sender, EventArgs e)
        {
            _login = new Login()
            {
                nome = txtLogin.Text,
                senha = txtSenha.Text,
              
            };



            //estou a fazer isso aqui :


            // --------- login ---------
            //aqui vamos ter a parte de login com hash e salt key sempre tentando seguir a lógica do bcrypt.net
            //essa lógica seria gerar uma hash que ja vai estar junto da saltkey e em seguida o próprio Bycript tbm ja faz a leitura e validação,
            //sendo assim, desnecessário realizar o save da salt key de forma separada no banco de dados para validação posterior

            //vamos chamar a função do banco de dados(login.Cs) que vai puxar a senha do banco
            
            _login.PullSenha();

            //pega a senha digitada e guarda na variável 
            string senhadigitada = txtSenha.Text;
       

            if (_login.count == 1)
            {
                ////  verifica automaticamente se a senha digitada gera o mesmo hash
                bool valido = BCrypt.Net.BCrypt.Verify(senhadigitada, _login.HashBanco);

                if (valido == true)
                {
                    _login.LoginPermissions();
                    MessageBox.Show("Login realizado com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    frmMainMenu check = new frmMainMenu(_login.nome, _login.idEscola);
                    check.Show();
                    Hide();
                    CleanAll();
                }
                else
                {
                    MessageBox.Show("Senha incorreta!", "Erro de Login");
                }
                
            }
            else
            {
                MessageBox.Show("usuario inexistente", "Não encontrado");
                CleanAll();
            }





            /////////// ---------- end login --------- //
            CleanAll();

 
        }

        private void linkLabel2_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            frmCadastroEmpresa check = new frmCadastroEmpresa();
            check.Show();
            Hide();
        }

        private void frmLogin_Load(object sender, EventArgs e)
        {
            Banco.CreateDatabase();
                baseY = pictureBox3.Top; // salva a posição inicial
                Timer flutuarTimer = new Timer();
                flutuarTimer.Interval = 18; // 15 ms para uma animação suave
                flutuarTimer.Tick += (s, ev) =>
                {
                    angle += speed;
                    pictureBox3.Top = baseY + (int)(Math.Sin(angle) * amplitude);
                };
                flutuarTimer.Start();

            txtSenha.PasswordChar = '*';
            txtLogin.Text = "Digite seu Login";
            txtLogin.ForeColor = Color.Gray;
            txtSenha.Text = "Digite sua Senha";
            txtSenha.ForeColor = Color.Gray;


        }

        private void button5_Click(object sender, EventArgs e)
        {
            frmNovaSenha form =  new frmNovaSenha();//IMPORTANTE---------------depois altere isso de volta para o "frmNovaSenha"
            form.Show();
            Hide();


        }


        private void txtLogin_Leave_1(object sender, EventArgs e)
        {
            if (txtLogin.Text == "")
            {
                txtLogin.Text = "Digite seu Login";
                txtLogin.ForeColor = Color.Gray;

            }
        }

        private void txtLogin_Enter_1(object sender, EventArgs e)
        {
            if (txtLogin.Text == "Digite seu Login")
            {
                txtLogin.Text = "";
                txtLogin.ForeColor = Color.Gray;
            }
        }

        private void txtSenha_Leave_1(object sender, EventArgs e)
        {
            if (txtSenha.Text == "")
            {
                txtSenha.Text = "Digite sua Senha";
                txtSenha.ForeColor = Color.Gray;

            }
        }

        private void txtSenha_Enter_1(object sender, EventArgs e)
        {
            if (txtSenha.Text == "Digite sua Senha")
            {
                txtSenha.Text = "";
                txtSenha.ForeColor = Color.Gray;
            }
        }

        private void MostrarSenha_CheckedChanged(object sender, EventArgs e)
        {
            if (chkMostrarSenha.Checked)
            {
                txtSenha.PasswordChar = '\u0000';
            }
            else
            {
                txtSenha.PasswordChar = '*';
            }
        }

        private void pictureBox3_Click(object sender, EventArgs e)
        {

        }

        private void pictureBox4_Click(object sender, EventArgs e)
        {

        }
    }
}
