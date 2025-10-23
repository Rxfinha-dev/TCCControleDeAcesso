using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using TCCControleDeAcesso.Models;



namespace TCCControleDeAcesso.Views
{

    public partial class frmMainMenu : Form
    {

        [DllImport("Gdi32", EntryPoint = "CreateRoundRectRgn")]

        private static extern IntPtr CreateRoundRgn
(
int nLeftRect,
int nTopRect,
int nRightRect,
int nBottomRect,
int nWidthEllipse,
int nHeightEllipse
);

        public int id_escola;
        public string _CurrentUsername;

        
        public frmMainMenu(string currentUsername, int idEscola)
        {
            InitializeComponent();
            //Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, Width, Height, 25, 25));
            label2.Text = currentUsername;
            id_escola = idEscola;
            _CurrentUsername = currentUsername;
        }

        public frmMainMenu(string text)
        {
            Text = text;
        }

        private void btnLogout_Click(object sender, EventArgs e)
        {
            frmLogin check = new frmLogin();         
            check.Show();
            Hide();
        }

        private void btnAlunos_Click(object sender, EventArgs e)
        {
            frmListaAlunos check = new frmListaAlunos(_CurrentUsername,id_escola);
            check.Show();
            Hide();
        }

        private void btnCursos_Click(object sender, EventArgs e)
        {
            frmCadastroCurso check = new frmCadastroCurso(_CurrentUsername,id_escola);
            check.Show();
            Hide();
        }

        private void frmMainMenu_Load(object sender, EventArgs e)
        {
            // Apply visual styling aligned with HelpUs palette
            Color accentColor = Color.FromArgb(0x34, 0xBC, 0xFB);

            if (lblTagline != null)
            {
                lblTagline.ForeColor = accentColor;
            }

            // Style and round cards if they exist (designer adds them)
            ApplyCardStyle(cardVerificacao);
            ApplyCardStyle(cardCursos);
            ApplyCardStyle(cardAlunos);
            ApplyCardStyle(cardEntradas);
            ApplyCardStyle(cardConfig);

            // Hover effects
            AttachHover(cardVerificacao, pbVerificacao, lblCardVerificacao);
            AttachHover(cardCursos, pbCursos, lblCardCursos);
            AttachHover(cardAlunos, pbAlunos, lblCardAlunos);
            AttachHover(cardEntradas, pbEntradas, lblCardEntradas);
            AttachHover(cardConfig, pbConfig, lblCardConfig);
        }

        private void ApplyCardStyle(Panel card)
        {
            if (card == null)
            {
                return;
            }
            card.BackColor = Color.White;
            card.BorderStyle = BorderStyle.FixedSingle;
            int radius = 18;
            card.Region = System.Drawing.Region.FromHrgn(CreateRoundRgn(0, 0, card.Width, card.Height, radius, radius));
            card.Padding = new Padding(8);
        }

        private void AttachHover(Panel card, Control icon, Control label)
        {
            if (card == null)
            {
                return;
            }
            EventHandler onEnter = (s, e) => { card.BackColor = Color.FromArgb(242, 250, 255); };
            EventHandler onLeave = (s, e) => { card.BackColor = Color.White; };
            card.MouseEnter += onEnter; card.MouseLeave += onLeave;
            if (icon != null) { icon.MouseEnter += onEnter; icon.MouseLeave += onLeave; }
            if (label != null) { label.MouseEnter += onEnter; label.MouseLeave += onLeave; }
        }

        private void button5_Click(object sender, EventArgs e)
        {
            //panel1.Height = b;
        }

        private void panel1_Paint(object sender, PaintEventArgs e)
        {

        }

        private void btnConfiguracoes_Click(object sender, EventArgs e)
        {
            frmConfiguracoes check = new frmConfiguracoes();
            check.Show();
        }

        private void btnVerificacao_Click(object sender, EventArgs e)
        {
            frmVerificacao check = new frmVerificacao(_CurrentUsername, id_escola);
            check.Show();
        }

        private void button8_Click(object sender, EventArgs e)
        {
            var arquivoDestino = @"X:\Backup\meuBanco.sql";
            var result = Backup(arquivoDestino);
            MessageBox.Show(result);
            Application.Exit();
        }

        private string Backup(string arquivoDestino)
        {
            try
            {
                using (var cn = new MySqlConnection(DatabaseServices.Connection))
                {
                    cn.Open();
                    using (var cmd = new MySqlCommand(null, cn))
                    {
                        using (var backupMysql = new MySqlBackup(cmd))
                        {
                            backupMysql.ExportToFile(arquivoDestino);
                        }
                    }
                }
                return "backup realizado";
            }
            catch (Exception ex)
            {
                return "Falha: " + ex.Message;
            }
        }

        private void btnVerificao_Click(object sender, EventArgs e)
        {
            frmVerificacao check = new frmVerificacao(_CurrentUsername, id_escola);
            check.Show();
            Hide();
        }

        private void btnCurso_Click(object sender, EventArgs e)
        {
            frmCadastroCurso check = new frmCadastroCurso(_CurrentUsername, id_escola);
            check.Show();
            Hide();
        }

        private void btnAluno_Click(object sender, EventArgs e)
        {
            frmListaAlunos check = new frmListaAlunos(_CurrentUsername, id_escola);
            check.Show();
            Hide();
        }

        private void btnConfig_Click(object sender, EventArgs e)
        {
         
            frmLog check = new frmLog(id_escola, _CurrentUsername);
            check.Show();
        }

        private void btnLog_Click(object sender, EventArgs e)
        {
            frmConfiguracoes check = new frmConfiguracoes();
            check.Show();
        }

        private void btnVoltar_Click(object sender, EventArgs e)
        {
            frmLogin FrmGuin = new frmLogin();
            this.Close();
            FrmGuin.Show();
        }

        
        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void pictureBox2_Click(object sender, EventArgs e)
        {

        }

        // New card click handlers mapped to existing navigation
        private void cardVerificacao_Click(object sender, EventArgs e)
        {
            btnVerificao_Click(sender, e);
        }

        private void cardCursos_Click(object sender, EventArgs e)
        {
            btnCurso_Click(sender, e);
        }

        private void cardAlunos_Click(object sender, EventArgs e)
        {
            btnAluno_Click(sender, e);
        }

        private void cardEntradas_Click(object sender, EventArgs e)
        {
            btnConfig_Click(sender, e);
        }

        private void cardConfig_Click(object sender, EventArgs e)
        {
            btnLog_Click(sender, e);
        }
    }
}
