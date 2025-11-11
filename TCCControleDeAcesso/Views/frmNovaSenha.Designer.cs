namespace TCCControleDeAcesso.Views
{
    partial class frmNovaSenha
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.panel1 = new System.Windows.Forms.Panel();
            this.panel2 = new System.Windows.Forms.Panel();
            this.btnVoltar = new System.Windows.Forms.Button();
            this.txtCodeVerify = new RJCodeAdvance.RJControls.RJTextBox();
            this.txtEmailDestinatario = new RJCodeAdvance.RJControls.RJTextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.btnVerify = new System.Windows.Forms.Button();
            this.btnEnviarEmail = new System.Windows.Forms.Button();
            this.label2 = new System.Windows.Forms.Label();
            this.panel1.SuspendLayout();
            this.panel2.SuspendLayout();
            this.SuspendLayout();
            // 
            // panel1
            // 
            this.panel1.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_sem_nome__13_1;
            this.panel1.Controls.Add(this.panel2);
            this.panel1.Controls.Add(this.txtCodeVerify);
            this.panel1.Controls.Add(this.txtEmailDestinatario);
            this.panel1.Controls.Add(this.label1);
            this.panel1.Controls.Add(this.btnVerify);
            this.panel1.Controls.Add(this.btnEnviarEmail);
            this.panel1.Controls.Add(this.label2);
            this.panel1.Location = new System.Drawing.Point(785, 230);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(476, 558);
            this.panel1.TabIndex = 12;
            this.panel1.Paint += new System.Windows.Forms.PaintEventHandler(this.panel1_Paint);
            // 
            // panel2
            // 
            this.panel2.Controls.Add(this.btnVoltar);
            this.panel2.Location = new System.Drawing.Point(10, 489);
            this.panel2.Name = "panel2";
            this.panel2.Size = new System.Drawing.Size(40, 59);
            this.panel2.TabIndex = 59;
            // 
            // btnVoltar
            // 
            this.btnVoltar.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnVoltar.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.sair;
            this.btnVoltar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnVoltar.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVoltar.Location = new System.Drawing.Point(-18, -3);
            this.btnVoltar.Name = "btnVoltar";
            this.btnVoltar.Size = new System.Drawing.Size(62, 70);
            this.btnVoltar.TabIndex = 57;
            this.btnVoltar.UseVisualStyleBackColor = false;
            this.btnVoltar.Click += new System.EventHandler(this.btnVoltar_Click);
            // 
            // txtCodeVerify
            // 
            this.txtCodeVerify.BackColor = System.Drawing.SystemColors.Window;
            this.txtCodeVerify.BorderColor = System.Drawing.Color.DodgerBlue;
            this.txtCodeVerify.BorderFocusColor = System.Drawing.Color.DeepSkyBlue;
            this.txtCodeVerify.BorderRadius = 0;
            this.txtCodeVerify.BorderSize = 2;
            this.txtCodeVerify.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.5F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtCodeVerify.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(64)))), ((int)(((byte)(64)))));
            this.txtCodeVerify.Location = new System.Drawing.Point(68, 336);
            this.txtCodeVerify.Margin = new System.Windows.Forms.Padding(4);
            this.txtCodeVerify.Multiline = false;
            this.txtCodeVerify.Name = "txtCodeVerify";
            this.txtCodeVerify.Padding = new System.Windows.Forms.Padding(10, 7, 10, 7);
            this.txtCodeVerify.PasswordChar = false;
            this.txtCodeVerify.PlaceholderColor = System.Drawing.Color.DarkGray;
            this.txtCodeVerify.PlaceholderText = "";
            this.txtCodeVerify.Size = new System.Drawing.Size(325, 31);
            this.txtCodeVerify.TabIndex = 50;
            this.txtCodeVerify.Texts = "";
            this.txtCodeVerify.UnderlinedStyle = true;
            // 
            // txtEmailDestinatario
            // 
            this.txtEmailDestinatario.BackColor = System.Drawing.SystemColors.Window;
            this.txtEmailDestinatario.BorderColor = System.Drawing.Color.DodgerBlue;
            this.txtEmailDestinatario.BorderFocusColor = System.Drawing.Color.DeepSkyBlue;
            this.txtEmailDestinatario.BorderRadius = 0;
            this.txtEmailDestinatario.BorderSize = 2;
            this.txtEmailDestinatario.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.5F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtEmailDestinatario.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(64)))), ((int)(((byte)(64)))));
            this.txtEmailDestinatario.Location = new System.Drawing.Point(68, 279);
            this.txtEmailDestinatario.Margin = new System.Windows.Forms.Padding(4);
            this.txtEmailDestinatario.Multiline = false;
            this.txtEmailDestinatario.Name = "txtEmailDestinatario";
            this.txtEmailDestinatario.Padding = new System.Windows.Forms.Padding(10, 7, 10, 7);
            this.txtEmailDestinatario.PasswordChar = false;
            this.txtEmailDestinatario.PlaceholderColor = System.Drawing.Color.DarkGray;
            this.txtEmailDestinatario.PlaceholderText = "";
            this.txtEmailDestinatario.Size = new System.Drawing.Size(325, 31);
            this.txtEmailDestinatario.TabIndex = 49;
            this.txtEmailDestinatario.Texts = "";
            this.txtEmailDestinatario.UnderlinedStyle = true;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Calibri", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(65, 261);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(117, 18);
            this.label1.TabIndex = 0;
            this.label1.Text = "Digite seu e-mail:";
            // 
            // btnVerify
            // 
            this.btnVerify.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnVerify.Font = new System.Drawing.Font("Dubai", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVerify.Location = new System.Drawing.Point(86, 450);
            this.btnVerify.Name = "btnVerify";
            this.btnVerify.Size = new System.Drawing.Size(293, 43);
            this.btnVerify.TabIndex = 11;
            this.btnVerify.Text = "VERIFICAR";
            this.btnVerify.UseVisualStyleBackColor = true;
            this.btnVerify.Click += new System.EventHandler(this.btnVerify_Click);
            // 
            // btnEnviarEmail
            // 
            this.btnEnviarEmail.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnEnviarEmail.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnEnviarEmail.Font = new System.Drawing.Font("Dubai", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnEnviarEmail.Location = new System.Drawing.Point(86, 401);
            this.btnEnviarEmail.Name = "btnEnviarEmail";
            this.btnEnviarEmail.Size = new System.Drawing.Size(293, 43);
            this.btnEnviarEmail.TabIndex = 8;
            this.btnEnviarEmail.Text = "ENVIAR E-MAIL";
            this.btnEnviarEmail.UseVisualStyleBackColor = false;
            this.btnEnviarEmail.Click += new System.EventHandler(this.btnEnviarEmail_Click);
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Calibri", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.Location = new System.Drawing.Point(65, 314);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(194, 18);
            this.label2.TabIndex = 9;
            this.label2.Text = "Digite o Código de verificação:";
            // 
            // frmNovaSenha
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.ClientSize = new System.Drawing.Size(1852, 929);
            this.Controls.Add(this.panel1);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Name = "frmNovaSenha";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
            this.Text = "NovaSenha";
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            this.Load += new System.EventHandler(this.frmNovaSenha_Load);
            this.panel1.ResumeLayout(false);
            this.panel1.PerformLayout();
            this.panel2.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button btnEnviarEmail;
        private System.Windows.Forms.Button btnVerify;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Panel panel1;
        private RJCodeAdvance.RJControls.RJTextBox txtEmailDestinatario;
        private RJCodeAdvance.RJControls.RJTextBox txtCodeVerify;
        private System.Windows.Forms.Panel panel2;
        private System.Windows.Forms.Button btnVoltar;
    }
}